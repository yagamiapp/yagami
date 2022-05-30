const { prisma } = require("../../../prisma");
const { bot: discord } = require("../../../discord");
const { Client } = require("nodesu");
const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { Team } = require("./Team");
const { convertEnumToAcro } = require("../../modEnum");
const { Map } = require("./Map");
const { stripIndents } = require("common-tags");
const { fetchChannel, fetchUser } = require("../../client");

// State Enumeration
let states = {
	"-1": "Archived",
	0: "Pick Phase",
	1: "Ready Phase",
	2: "Play Phase",
	3: "Waiting for Match Link",
	4: "Warmups",
	5: "Rolling Phase",
	6: "Roll Winner Selection",
	7: "Ban Phase",
	8: "Winner found",
	9: "Match Closed",
	10: "Not Started",
};

let nodesuClient = new Client(process.env.banchoAPIKey);

// There's currently a bug with local SQLite
// Databases, where too many requests in
// Succession will crash prisma.
let prismaTimeout = 200;

class MatchManager {
	/**
	 *
	 * @constructor
	 * @param {number} id ID of the match
	 * @param {string} mp The link to the match
	 */
	constructor(id, mp) {
		this.id = id;
		this.mp = mp;
		this.init = false;
		this.rollVerification = {};
	}

	async createMatch() {
		// Get match from DB and assign values
		let match = await prisma.match.findFirst({
			where: {
				id: this.id,
			},
		});
		this.message_id = match.message_id;
		this.channel_id = match.channel_id;
		this.state = match.state;
		this.waiting_on = match.waiting_on;

		// Get tournament from DB
		this.tournament = await prisma.tournament.findFirst({
			where: {
				rounds: {
					some: {
						Match: {
							some: {
								id: this.id,
							},
						},
					},
				},
			},
		});

		// Get round from DB
		this.round = await prisma.round.findFirst({
			where: {
				Match: {
					some: {
						id: this.id,
					},
				},
			},
		});

		// Make team objects from db
		let dbTeams = await prisma.team.findMany({
			where: {
				InBracketMatches: {
					some: {
						matchId: this.id,
					},
				},
			},
		});

		// Create teams and
		/**
		 * @type {Team[]}
		 */
		this.teams = [];
		for (let team of dbTeams) {
			let users = await prisma.user.findMany({
				where: {
					InTeams: {
						some: {
							teamId: team.id,
						},
					},
				},
			});
			let newTeam = new Team(this, team, users);
			let teamInMatch = await prisma.teamInMatch.findFirst({
				where: {
					teamId: team.id,
					matchId: this.id,
				},
			});

			await newTeam.setTeamInMatch(teamInMatch);
			this.teams.push(newTeam);
		}

		// Get mappool from DB
		/**
		 * @type {Map[]}
		 */
		this.mappool = [];
		/**
		 * @type {Map[]}
		 */
		this.bans = [];
		/**
		 * @type {Map[]}
		 */
		this.picks = [];
		let mappool = await prisma.mapInMatch.findMany({
			where: {
				matchId: this.id,
			},
		});

		for (const mapInMatch of mappool) {
			let map = await prisma.map.findFirst({
				where: {
					InPools: {
						some: {
							InMatches: {
								some: {
									matchId: this.id,
								},
							},
							identifier: mapInMatch.mapIdentifier,
						},
					},
				},
			});
			let mapInPool = await prisma.mapInPool.findFirst({
				where: {
					mapId: map.beatmap_id,
					InMatches: {
						some: {
							Match: {
								id: this.id,
							},
						},
					},
				},
			});
			let mapObj = new Map(this, map, mapInMatch);
			mapObj.setMapInPool(mapInPool);
			// Give bans to teams
			if (mapObj.banned) {
				this.bans.push(mapObj);
				await mapObj.bannedBy.addBan(mapObj);
			}
			if (mapObj.picked) {
				this.picks.push(mapObj);
				await mapObj.pickedBy.addPick(mapObj);
			}
			if (mapObj.won) {
				await mapObj.wonBy.addWin(mapObj);
			}
			this.mappool.push(mapObj);
		}

		// Update state if no mp link
		if (!this.mp) {
			await this.updateState(-1);
			return;
		}

		// Set Last Game Data
		let matchNum = this.mp.match(/\d+/g);
		let data = await nodesuClient.multi.getMatch(matchNum[0]);
		let lastGame = data.games[data.games.length - 1];
		/**
		 * @type {import("nodesu")}
		 */
		this.lastGameData = lastGame;

		// Setup channel
		this.channel = fetchChannel(this.mp);
		/**
		 * @type {import("bancho.js").BanchoLobby}
		 */
		this.lobby = this.channel.lobby;
		try {
			await this.channel.join();
		} catch (e) {
			console.log(`${this.mp} no longer exists`);
			await this.updateState(-1);
			return;
		}
		await this.lobby.clearHost();

		// Update db object
		await prisma.match.update({
			where: {
				id: this.id,
			},
			data: {
				mp_link: this.lobby.getHistoryUrl(),
			},
		});
		this.mp = this.lobby.getHistoryUrl();

		// Setup lobby settings
		await this.lobby.setSettings(
			this.tournament.team_mode,
			this.tournament.score_mode == 4 ? 3 : this.tournament.score_mode,
			this.tournament.x_v_x_mode * 2 + 1
		);

		// Do onJoin for players currently in the lobby
		let players = this.lobby.slots.filter((x) => x);
		for (let player of players) {
			await this.joinHandler({ player });
		}

		// Start Warmups
		this.init = true;

		// Send invites to players outside of the lobby
		let invitesToIgnore = players
			.filter((player) => player)
			.map((player) => player.user.username);

		for (const team of this.teams) {
			let users = team.users;

			for (const user of users) {
				if (!invitesToIgnore.includes(user.osu_username)) {
					await this.invitePlayer(user.osu_username);
				}
			}
		}

		// Setup event handlers
		this.channel.on("message", async (msg) => await this.msgHandler(msg));
		this.lobby.on(
			"playerJoined",
			async (event) => await this.joinHandler(event)
		);
		this.lobby.on("allPlayersReady", async () => await this.readyHandler());
		this.lobby.on("matchFinished", async () => await this.finishHandler());
		this.lobby.on(
			"beatmap",
			async (beatmap) => await this.beatmapHandler(beatmap)
		);
		if (this.state == 3) {
			await this.updateState(4);
			await this.warmup();
			return;
		}

		await this.recover();
		await this.updateMessage();
	}
	/**
	 *
	 * @param {import("bancho.js").BanchoLobbyPlayer} event
	 */
	async joinHandler(event) {
		let user;
		let team;
		for (let teamTest of this.teams) {
			let userTest = teamTest.getUserPos(event.player.user._id);
			if (userTest != null) {
				user = teamTest.getUser(userTest);
				team = teamTest;
				team.addPlayer(event.player);
			}
		}
		if (user == null) {
			await this.channel.lobby.kickPlayer(event.player.user.username);
			return;
		}

		if (team == this.teams[0]) {
			console.log("Team 0");
		}
		if (team == this.teams[1]) {
			console.log("Team 1");
		}

		if (this.state == 4 && this.init) {
			await this.warmup();
		}
	}

	async readyHandler() {
		if (this.state == 4) {
			await this.channel.sendMessage("All players ready!");
			await this.lobby.startMatch(5);
		}
		if (this.state == 1) {
			// Count Players
			let lobbyCount = {};
			for (const team of this.teams) {
				let teamIndex = this.teams.indexOf(team);
				for (const slot of this.lobby.slots) {
					if (team.players.includes(slot)) {
						lobbyCount[teamIndex] =
							lobbyCount[teamIndex] == null
								? 1
								: lobbyCount[teamIndex] + 1;
					}
				}
			}

			let badTeams = [];
			for (const key in lobbyCount) {
				let teamCount = lobbyCount[key];
				if (teamCount != this.tournament.x_v_x_mode) {
					badTeams.push(key);
				}
			}

			if (badTeams.length >= 1) {
				let teamString = "";
				for (const team of badTeams) {
					teamString += this.teams[team].name + " ";
				}
				await this.channel.sendMessage(
					`The following teams do not have the correct amount of players: ${teamString}`
				);
				return;
			}

			await this.updateState(2);
			await this.lobby.startMatch(5);
			await this.channel.sendMessage("glhf!");
		}
	}

	async finishHandler() {
		let matchNum = this.mp.match(/\d+/g);
		let data = await nodesuClient.multi.getMatch(matchNum[0]);
		let lastGame = data.games[data.games.length - 1];
		this.lastGameData = lastGame;
		this.updateMessage();

		if (this.state == 4) {
			let team = this.teams[this.waiting_on];
			await team.setWarmedUp(true);
			await this.updateWaitingOn(1 - this.waiting_on);
			await this.warmup();
		}
		if (this.state == 2) {
			let scoreString = "";
			for (const team of this.teams) {
				let score = team.calculateScore(team);
				scoreString +=
					scoreString == ""
						? `${team.name} (${score.toLocaleString()})`
						: ` | ${team.name} (${score.toLocaleString()})`;
			}
			await this.channel.sendMessage(scoreString);
			let compareScore = this.teams[0].compareTo(this.teams[1]);
			if (compareScore == 0) {
				await this.channel.sendMessage(
					"Wow! A tie? That's happened X times so far, Let's try that again"
				);
				await this.updateState(1);
				return;
			}

			let searchArr = this.mappool
				.filter((x) => x.pickNumber)
				.sort((a, b) => b.pickNumber - a.pickNumber);
			let lastMap = searchArr[0];

			if (compareScore <= 0) {
				let winner = this.teams[1];
				await winner.addScore();
				await winner.addWin(lastMap);
			}

			if (compareScore >= 0) {
				let winner = this.teams[0];
				await winner.addScore();
				await winner.addWin(lastMap);
			}

			let scoreToWin = (this.round.best_of + 1) / 2;

			for (const team of this.teams) {
				if (team.score >= scoreToWin) {
					await this.channel.sendMessage(
						`${team.name} has won the match! GGWP!`
					);
					await this.updateState(8);
					await this.channel.sendMessage(
						`The lobby will be closed in 90 seconds`
					);
					await this.lobby.startTimer(90);
					setTimeout(() => {
						this.lobby.closeLobby();
						this.updateState(9);
					}, 90 * 1000);
					return;
				}
			}

			// Check for TB
			let tiebreakers = this.mappool.filter((x) =>
				x.identifier.includes("TB")
			);

			if (tiebreakers.length > 0) {
				let tb = true;
				for (const team of this.teams) {
					if (team.score == scoreToWin - 1) {
						tb = tb && true;
					} else {
						tb = false;
					}
				}
				if (tb) {
					await this.channel.sendMessage(
						`It's a tie so far, time for the tiebreaker!`
					);
					let tb = await prisma.mapInPool.findFirst({
						where: {
							InMatches: {
								some: {
									matchId: this.id,
								},
							},
							identifier: tiebreakers[0].mapIdentifier,
						},
					});
					await this.addPick(tb);
					await this.updateState(1);
					return;
				}
			}

			await this.updateWaitingOn(1 - this.waiting_on);
			await this.updateState(0);
			await this.pickPhase();
		}
	}

	async beatmapHandler(beatmap) {
		this.beatmap = beatmap;
		await this.updateMessage();
	}

	async warmup() {
		if (this.waiting_on == null) {
			await this.updateWaitingOn(0);
		}
		let team = this.teams[this.waiting_on];

		if (team.warmed_up) {
			await this.lobby.clearHost();
			await this.updateState(5);
			await this.roll();
			return;
		}

		// If current host is on warming up team, do nothing
		let host = this.lobby.getHost();
		let user = team.getUserPos(host?.user?.id);
		if (user != undefined || user != null) return;

		let slots = this.lobby.slots.filter((slot) => slot);

		for (const player of team.players) {
			let slotMap = slots.map((slot) => slot?.user?.username);
			if (slotMap.includes(player.user.username)) {
				await this.lobby.setHost(player.user.username);
				if (!this.lobby.freemod) {
					await this.lobby.setMods("Freemod");
				}
				await this.channel.sendMessage(
					`${player.user.username} has been selected to choose the warmup for ${team.name}. Use !skip to skip your warmup`
				);
				await this.channel.sendMessage(
					`You have 3 minutes to start the warmup`
				);
				await this.lobby.startTimer(180);
				return;
			}
		}
		await this.channel.sendMessage(
			`Waiting for ${team.name} to join so they can get the host`
		);
	}

	async roll() {
		let teamRolls = this.teams.map((team) => team.roll);
		// If both rolls are null
		if (teamRolls.filter((team) => team).length == 0) {
			await this.channel.sendMessage(
				"It's time to roll! I'll count the first roll from any player on each team."
			);
			await this.updateMessage();
			return;
		}

		if (!teamRolls.includes(null)) {
			await this.updateMessage();

			// Check if all elements in array are the same
			let rolls = [...new Set(teamRolls)];
			if (rolls.length == 1) {
				await this.channel.sendMessage(
					`Wow, a roll tie! Let's try again.`
				);
				this.teams.forEach((team) => team.setRoll(null));
				this.roll();
				return;
			}

			let winner = teamRolls.indexOf(Math.max(...teamRolls));
			let team = this.teams[winner];
			await this.updateWaitingOn(winner);
			await this.updateState(6);
			await this.channel.sendMessage(`${team.name} has won the roll!`);
			await this.chooseOrder();
		}
	}

	async chooseOrder() {
		let team = this.teams[this.waiting_on];
		if (team.pick_order && team.ban_order) {
			if (team.ban_order == 1) {
				await this.updateWaitingOn(this.teams.indexOf(team));
			} else {
				await this.updateWaitingOn(1 - this.teams.indexOf(team));
			}
			await this.updateState(7);
			await this.banPhase();
			return;
		}

		await this.channel.sendMessage(
			`${team.name}, it is your turn to pick! Use !choose [first|second] [pick|ban] to choose the order`
		);
	}

	async banPhase() {
		let team = this.teams[this.waiting_on];
		if (team.bans.length >= this.round.bans) {
			// If team 0 is the first picker, 1 - 1 = 0:
			// If team 1 is the first picker, 2 - 1 = 1:
			let firstPicker = this.teams[0].pick_order - 1;
			this.updateWaitingOn(firstPicker);
			await this.updateState(0);
			await this.pickPhase();
			return;
		}
		await this.channel.sendMessage(
			`${team.name}, It's your turn to ban. Use !ban [map] to ban a map`
		);
		await this.channel.sendMessage(
			`You have ${this.round.bans - team.bans.length} ${
				this.round.bans - team.bans.length == 1 ? "ban" : "bans"
			} left, Use !list to see the available bans`
		);
		await this.updateMessage();
	}

	async pickPhase() {
		let team = this.teams[this.waiting_on];
		let bestOfPhrase = `Best of ${this.round.best_of}`;
		for (const team of this.teams) {
			if (team.score == (this.round.best_of - 1) / 2) {
				bestOfPhrase = `Match Point: ${team.name}`;
			}
		}

		await this.channel.sendMessage(
			`${this.teams[0].name} | ${this.teams[0].score} - ${this.teams[1].score} | ${this.teams[1].name} // ${bestOfPhrase} //Next pick: ${team.name}`
		);
		await this.channel.sendMessage("Use !pick [map] to pick a map");
	}

	async recover() {
		if (this.state == 0) {
			await this.pickPhase();
			return;
		}

		if (this.state == 3) {
			await this.updateState(-1);
			return;
		}

		if (this.state == 4) {
			await this.warmup();
			return;
		}
		if (this.state == 5) {
			await this.roll();
			return;
		}

		if (this.state == 6) {
			await this.chooseOrder();
			return;
		}

		if (this.state == 7) {
			await this.banPhase();
			return;
		}

		if (this.state == 8) {
			this.lobby.closeLobby();
			this.updateState(9);
			return;
		}
	}

	async warmupListener(msg) {
		if (this.waiting_on == null) return;
		let team = this.teams[this.waiting_on];
		let user = team.getUserPos(msg.user.id);
		if (user == null) return;

		let command = msg.content.match(/^!skip/g);
		if (command) {
			let team = this.teams[this.waiting_on];
			await team.setWarmedUp(true);
			await this.updateWaitingOn(1 - this.waiting_on);
			await this.warmup();
		}
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async rollListener(msg) {
		if (msg.content.toLowerCase() == "!roll") {
			this.rollVerification[msg.user.ircUsername] = true;
			return;
		}

		if (msg.user.ircUsername != "BanchoBot") return;

		let content = msg.content;
		let roll = content.match(/(?<user>\w+) rolls (?<roll>\d+) point\(s\)/);

		if (roll && this.rollVerification[roll.groups.user]) {
			let team;
			for (const teamTest of this.teams) {
				let userList = teamTest.users.map((user) => user.osu_username);
				if (userList.includes(roll.groups.user)) {
					team = teamTest;
				}
			}
			if (!team) return;

			if (team.roll == null) {
				team.setRoll(parseInt(roll.groups.roll));
				await this.channel.sendMessage(
					`${team.name} rolled a ${roll.groups.roll}`
				);
				this.rollVerification[msg.user.ircUsername] = null;
				await this.roll();
			}
		}
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 * @returns
	 */
	async chooseListener(msg) {
		let team = this.teams[this.waiting_on];
		let user = team.getUserPos(msg.user.id);
		user = team.getUser(user);
		if (user == null) return;
		let command = msg.content.match(
			/!choose (?<order>first|second) (?<type>pick|ban)/
		);
		if (!command && msg.content.startsWith("!choose")) {
			await this.channel.sendMessage(
				"Invalid command usage! Correct Usage: !choose [first|second] [pick|ban]"
			);
		}

		if (!command) return;

		if (command.groups.type.toLowerCase() == "pick") {
			if (team.pick_order) {
				await this.channel.sendMessage(
					`The pick order has already been chosen`
				);
				return;
			}
			if (command.groups.order.toLowerCase() == "first") {
				await team.setPickOrder(1);
				let otherTeam = this.teams[1 - this.waiting_on];
				await otherTeam.setPickOrder(2);
			}
			if (command.groups.order.toLowerCase() == "second") {
				await team.setPickOrder(2);
				let otherTeam = this.teams[1 - this.waiting_on];
				await otherTeam.setPickOrder(1);
			}
			this.updateWaitingOn(1 - this.waiting_on);
			await this.chooseOrder();
		}

		if (command.groups.type.toLowerCase() == "ban") {
			if (team.ban_order) {
				await this.channel.sendMessage(
					`The ban order has already been chosen`
				);
				return;
			}
			if (command.groups.order.toLowerCase() == "first") {
				await team.setBanOrder(1);
				let otherTeam = this.teams[1 - this.waiting_on];
				await otherTeam.setBanOrder(2);
			}
			if (command.groups.order.toLowerCase() == "second") {
				await team.setBanOrder(2);
				let otherTeam = this.teams[1 - this.waiting_on];
				await otherTeam.setBanOrder(1);
			}
			await this.updateWaitingOn(1 - this.waiting_on);
			await this.chooseOrder();
		}
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 * @returns
	 */
	async banListener(msg) {
		let team = this.teams[this.waiting_on];
		let user = team.getUserPos(msg.user.id);

		if (user == null) return;
		let command = msg.content.match(/!ban (?<map>\w+)/);

		if (!command) return;
		let mapString = command.groups.map.toUpperCase();
		let map = this.mappool.find((x) => x.identifier == mapString);
		if (!map) {
			await this.channel.sendMessage(
				`Map ${command.groups.map} not found`
			);
			return;
		}

		// If the map is already banned
		if (map.banned) {
			await this.channel.sendMessage(
				`${map.identifier} has already been chosen as a ban`
			);
			return;
		}

		// Check for double bans
		let otherBans = this.mappool.filter((x) => x.bannedBy?.id == team.id);
		let otherBanMods = otherBans.map((ban) => ban.mods);
		if (
			(this.tournament.double_ban == 1 && map.mods != "") ||
			this.tournament.double_ban == 0
		) {
			if (otherBanMods.includes(map.mods)) {
				await this.channel.sendMessage(
					`You cannot ban from the same modpool more than once.`
				);
				return;
			}
		}

		// If the team tried to ban the TB
		if (command.groups.map.substring(0, 2).toLowerCase() == "tb") {
			await this.channel.sendMessage(
				`Silly goose! The tiebreaker is unbannable.`
			);
			return;
		}

		this.bans.push(map);
		await team.addBan(map);
		await this.channel.sendMessage(
			`${team.name} chooses to ban ${map.identifier}`
		);
		await this.updateMessage();
		await this.updateWaitingOn(1 - this.waiting_on);
		await this.banPhase();
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async pickListener(msg) {
		let team = this.teams[this.waiting_on];
		let user = team.getUserPos(msg.user.id);

		if (user == null) return;
		let command = msg.content.match(/!pick (?<map>\w+)/);

		if (!command) return;
		let mapString = command.groups.map.toUpperCase();
		let map = this.mappool.find((x) => x.identifier == mapString);

		if (!map) {
			await this.channel.sendMessage("Invalid map name");
			return;
		}

		// Check if banned
		if (map.banned) {
			await this.channel.sendMessage(
				`${map.identifier} was one of the bans`
			);
			return;
		}

		// Check for previous picks
		if (map.picked) {
			await this.channel.sendMessage(
				`${map.identifier} has already been picked`
			);
			return;
		}

		// Check for double picks
		let lastTeamPickMods = this.mappool
			.filter((x) => x.pickedBy?.id == team.id)
			.sort((a, b) => a.pickTeamNumber - b.pickTeamNumber)
			.map((x) => x.mods);
		let lastTeamPick = lastTeamPickMods[lastTeamPickMods.length - 1];

		if (
			(this.tournament.double_pick == 1 && lastTeamPick != "") ||
			this.tournament.double_pick == 0
		) {
			if (lastTeamPick == map.mods) {
				await this.channel.sendMessage(
					`You cannot pick the same modpool twice.`
				);
				return;
			}
		}

		// If the team tried to pick the TB
		if (command.groups.map.substring(0, 2).toLowerCase() == "tb") {
			await this.channel.sendMessage(
				"Silly goose! The tiebreaker is unpickable."
			);
			return;
		}

		await this.addPick(map);
		await this.channel.sendMessage(
			`${team.name} chooses ${map.identifier} | [https://osu.ppy.sh/b/${map.beatmapId} ${map.artist} - ${map.title} [${map.version}]] - [https://beatconnect.io/b/${map.beatmapset_id} Beatconnect Mirror] - [https://api.chimu.moe/v1/download/${map.beatmapset_id} chimu.moe Mirror]`
		);
	}
	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async listCommand(msg) {
		let command = msg.content.match(/^!list/g);
		if (!command) return;

		let team = this.teams[this.waiting_on];
		let mapString = "";
		for (let map of this.mappool) {
			// Detect previous picks and bans
			if (map.picked || map.banned) continue;
			if (map.identifier.toUpperCase().includes("TB")) continue;
			// Detect double picks
			if (this.state == 0) {
				let lastTeamPickMods = this.mappool
					.filter((x) => x.pickedBy?.id == team.id)
					.sort((a, b) => a.pickTeamNumber - b.pickTeamNumber)
					.map((x) => x.mods);
				let lastTeamPick =
					lastTeamPickMods[lastTeamPickMods.length - 1];
				if (
					(this.tournament.double_pick == 1 && lastTeamPick != "") ||
					this.tournament.double_pick == 0
				) {
					if (lastTeamPick == map.mods) {
						continue;
					}
				}
			}
			// Detect double bans
			if (this.state == 7) {
				let otherBans = this.mappool.filter(
					(x) => x.bannedBy?.id == team.id
				);
				let otherBanMods = otherBans.map((ban) => ban.mods);
				if (
					(this.tournament.double_ban == 1 && map.mods != "") ||
					this.tournament.double_ban == 0
				) {
					if (otherBanMods.includes(map.mods)) {
						continue;
					}
				}
			}
			mapString +=
				mapString.length > 0 ? `, ${map.identifier}` : map.identifier;
		}

		let type;
		switch (this.state) {
			case 7:
				type = "bans";
				break;
			case 0:
				type = "picks";
				break;
		}
		await this.channel.sendMessage(`Available ${type}: ${mapString}`);
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async bansCommand(msg) {
		let command = msg.content.match(/^!bans/g);
		if (!command) return;

		if (this.bans.length == 0) {
			await this.channel.sendMessage("No bans have been chosen yet");
			return;
		}

		let banString = "Bans: ";
		for (const team of this.teams) {
			let teamString = `${team.name}: `;
			for (const ban of team.bans) {
				// Check for a colon, if there is one, it's the first ban
				teamString +=
					teamString[teamString.length - 2] == ":"
						? ban.identifier
						: `, ${ban.identifier}`;
			}
			if (teamString.length == team.name.length + 2)
				teamString = `${team.name}: None`;
			banString += teamString + "; ";
		}
		await this.channel.sendMessage(banString);
	}
	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async scoreCommand(msg) {
		let command = msg.content.match(/^!score/g);
		if (!command) return;

		let team = this.teams[this.waiting_on];
		let bestOfPhrase = `Best of ${this.round.best_of}`;
		for (const team of this.teams) {
			if (team.score == (this.round.best_of - 1) / 2) {
				bestOfPhrase = `Match Point: ${team.name}`;
			}
		}

		await this.channel.sendMessage(
			`${this.teams[0].name} | ${this.teams[0].score} - ${this.teams[1].score} | ${this.teams[1].name} // ${bestOfPhrase} //Next pick: ${team.name}`
		);
	}

	/**
	 * Picks a map in the lobby and adds it to the
	 * @param {import("./Map").Map} map
	 */
	async addPick(map) {
		let team = this.teams[this.waiting_on];
		this.picks.push(map);
		await team.addPick(map);

		await prisma.mapInMatch.update({
			where: {
				mapIdentifier_matchId: {
					matchId: this.id,
					mapIdentifier: map.identifier,
				},
			},
			data: {
				pickNumber: this.picks.length,
				pickTeamNumber: team.picks.length,
			},
		});

		await this.lobby.setMap(map.beatmap_id);

		let modString = map.mods;
		if (this.tournament.force_nf) {
			if (!modString.includes("NF")) {
				modString += " NF";
			}
		}
		await this.lobby.setMods(modString);
		await this.updateState(1);
	}

	async invitePlayer(name) {
		let user = await fetchUser(name);
		await user.sendMessage(
			"Here is your invite to the match. If you do not recieve the invite, use !invite to get a new one."
		);
		await this.lobby.invitePlayer(user.ircUsername);
	}
	/**
	 * Moves a player to a different slot, or swaps their
	 * position with the player in that slot
	 * @param {import("bancho.js").BanchoLobbyPlayer} player
	 * @param {number} slot
	 */
	async swapPlayer(player, slot) {}
	/**
	 *
	 * @param {number} num The team that you're waiting on
	 * @private
	 */
	async updateWaitingOn(num) {
		this.waiting_on = num;
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
		await prisma.match.update({
			where: {
				id: this.id,
			},
			data: {
				waiting_on: num,
			},
		});
	}

	/**
	 * Updates the state of the match
	 * @function
	 * @private
	 * @param {number} state
	 */
	async updateState(state) {
		this.state = state;

		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
		await prisma.match.update({
			where: {
				id: this.id,
			},
			data: {
				state: state,
			},
		});

		await this.updateMessage();
		console.log(`Match ${this.id} state updated to ${states[state]}`);
	}

	/**
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async msgHandler(msg) {
		if (msg.self) return;
		console.log(
			`[${msg.channel.name}] ${msg.user.ircUsername} >> ${msg.message}`
		);

		// Archive match if bot loses access to lobby
		if (msg.content.match(/^!mp close/g)) {
			await this.updateState(-1);
			return;
		}

		if (msg.content.match(/^!mp removeref/g)) {
			try {
				await this.channel.sendMessage(
					`WARNING: Match will be automatically archived if the bot loses access to the lobby.`
				);
			} catch (e) {
				console.log("Failed to send message, archiving lobby");
				await this.updateState(-1);
				return;
			}
		}

		if ((this.state >= 0 && this.state <= 2) || this.state == 7) {
			await this.listCommand(msg);
			await this.bansCommand(msg);
		}
		if (this.state >= 0 && this.state <= 2) {
			await this.scoreCommand(msg);
		}

		if (this.state == 4) {
			await this.warmupListener(msg);
			return;
		}

		if (this.state == 5) {
			await this.rollListener(msg);
			return;
		}

		if (this.state == 6) {
			await this.chooseListener(msg);
			return;
		}

		if (this.state == 7) {
			await this.banListener(msg);
			return;
		}
		if (this.state == 0) {
			await this.pickListener(msg);
		}
	}

	/**
	 * Updates the log message
	 * @function
	 * @private
	 */
	async updateMessage() {
		let state = this.state;

		let emotes = {
			teams: {},
			grades: {},
			loading: "<a:loading:970406520124764200>",
		};
		emotes.teams[this.teams[0].id] = ":red_square:";
		emotes.teams[this.teams[1].id] = ":blue_square:";

		emotes.grades = {
			SSH: "<:rank_SSH:979114277929631764>",
			SS: "<:rank_SS:979114272955179069>",
			SH: "<:rank_SH:979114267850727465>",
			S: "<:rank_S:979114262502973450>",
			A: "<:rank_A:979114140465516645>",
			B: "<:rank_B:979114234233372752>",
			C: "<:rank_C:979114239736299570>",
			D: "<:rank_D:979114244777857096>",
			F: "<:rank_F:979114251337744504>",
		};

		let channel = await discord.channels.fetch(this.channel_id);
		/**
		 * @type {import("discord.js").Message}
		 */
		let message = await channel.messages.fetch(this.message_id);
		let oldembed = message.embeds[0];
		let description = "";
		let embed = new MessageEmbed()
			.setTitle(oldembed.title)
			.setColor(this.tournament.color)
			.setAuthor(oldembed.author)
			.setThumbnail(oldembed.thumbnail?.url)
			.setURL(this.mp)
			.setImage(oldembed.image?.url)
			.setFooter({ text: "Current phase: " + states[this.state] })
			.setTimestamp();

		// Score line
		if (state <= 2 || (state >= 5 && state <= 7)) {
			embed.addField(
				"Score",
				`
				${emotes.teams[this.teams[0].id]} ${this.teams[0].name} | ${
					this.teams[0].score
				} - ${this.teams[1].score} | ${this.teams[1].name} ${
					emotes.teams[this.teams[1].id]
				}`
			);
		}

		// Individual Score Table
		if (
			([0, 1].includes(state) &&
				this.lastGameData &&
				this.picks.length > 0) ||
			(state == 4 && this.lastGameData)
		) {
			let leaderboard = "";
			let lastMap = (
				await nodesuClient.beatmaps.getByBeatmapId(
					this.lastGameData.beatmap_id
				)
			)[0];
			let { title, artist, version } = lastMap;
			let lastMapId =
				this.mappool.find((map) => map.beatmap_id == lastMap.beatmap_id)
					?.identifier || "Warmup";
			leaderboard += `**${lastMapId}**: ${title} - ${artist} [${version}]\n`;

			let teamStrings = {};
			for (const team of this.teams) {
				teamStrings[team.id] = { userScores: [] };
				teamStrings[team.id].team = team;
			}

			for (const score of this.lastGameData.scores) {
				// Get team of user from id
				let playerId = score.user_id;
				let team;
				for (const teamTest of this.teams) {
					if (teamTest.users.find((u) => u.osu_id == playerId)) {
						team = teamTest;
					}
				}
				let user = team.users.find((u) => u.osu_id == playerId);

				let mods = convertEnumToAcro(score.enabled_mods);

				// Calculate acc
				let accuracy =
					300 * score.count300 +
					100 * score.count100 +
					50 * score.count50;
				let divisor =
					300 *
					(parseInt(score.count300) +
						parseInt(score.count100) +
						parseInt(score.count50) +
						parseInt(score.countmiss));
				accuracy = accuracy / divisor;
				// Calculate grade
				let grade = "";
				let percent300 =
					parseInt(score.count300) /
					(parseInt(score.count300) +
						parseInt(score.count100) +
						parseInt(score.count50) +
						parseInt(score.countmiss));
				let percent50 =
					parseInt(score.count50) /
					(parseInt(score.count300) +
						parseInt(score.count100) +
						parseInt(score.count50) +
						parseInt(score.countmiss));
				if (score.countmiss == 0) {
					if (percent300 > 0.9) {
						if (percent50 < 0.1) {
							if (mods.includes("HD") || mods.includes("FL")) {
								grade = "SH";
							} else {
								grade = "S";
							}
						}
					} else if (percent300 > 0.8) {
						grade = "A";
					} else if (percent300 > 0.7) {
						grade = "B";
					}
				} else {
					if (percent300 > 0.9) {
						grade = "A";
					} else if (percent300 > 0.8) {
						grade = "B";
					} else if (percent300 > 0.6) {
						grade = "C";
					}
				}
				if (accuracy == 1) {
					if (mods.includes("HD") || mods.includes("FL")) {
						grade = "SSH";
					} else {
						grade = "SS";
					}
				}

				if (grade == "") {
					grade = "D";
				}
				if (score.pass == 0) {
					grade = "F";
				}

				let userScore = [
					emotes.grades[grade],
					user.osu_username,
					parseInt(score.score).toLocaleString(),
					parseInt(score.maxcombo).toLocaleString() + "x",
					(accuracy * 100).toFixed(2) + "%",
					`${mods == "" ? "" : "+" + mods.join("")}`,
				];

				teamStrings[team.id].userScores.push(userScore);
			}

			for (const key in teamStrings) {
				const teamString = teamStrings[key];
				if (teamString.userScores?.length > 0) {
					let teamLb = `${emotes.teams[teamString.team.id]} **${
						teamString.team.name
					}**\n`;
					// TODO: Get max of each column and add spaces to align
					let maxes = [];
					for (let i = 1; i < teamString.userScores[0].length; i++) {
						maxes.push(getMaxLength(teamString.userScores, i));
					}

					for (const userScore of teamString.userScores) {
						let grade = userScore.splice(0, 1);
						let mods = userScore.splice(userScore.length - 1, 1);

						// Add spaces to align
						for (let i = 0; i < userScore.length; i++) {
							let prop = userScore[i];
							for (let j = prop.length; j < maxes[i]; j++) {
								prop += " ";
							}
							userScore[i] = prop;
						}

						teamLb += `${grade} \`${userScore.join("` `")}\``;
						if (lastMapId.includes("FM") || lastMapId == "Warmup") {
							teamLb += `${mods}\n`;
						} else {
							teamLb += "\n";
						}
					}
					leaderboard += teamLb + "\n";
				}
			}
			description += "\n" + leaderboard;
		}

		// Match Rolls
		if (state >= 5 && state <= 7) {
			description += "\n";

			for (const team of this.teams) {
				if (team.roll == null) return;

				description += `**${team.name}** rolled a **${team.roll}**\n`;
			}
		}

		// Beatmap Image
		if (this.beatmap) {
			embed.setImage(
				`https://assets.ppy.sh/beatmaps/${this.beatmap?.setId}/covers/cover.jpg`
			);
		}

		// Handle bans
		let bans = this.bans;
		if (bans.length > 0) {
			let banString = "";
			let teamString = {};
			for (const ban of bans) {
				if (!ban.banned) return;
				let string =
					teamString[ban.bannedBy.id] == null
						? `${ban.identifier}`
						: `, ${ban.identifier}`;

				teamString[ban.bannedBy.id] =
					teamString[ban.bannedBy.id] == null
						? string
						: (teamString[ban.bannedBy.id] += string);
			}

			banString = `
				${emotes.teams[this.teams[0].id]} **${this.teams[0].name}:** ${
				teamString[this.teams[0].id] || ""
			}
				${emotes.teams[this.teams[1].id]} **${this.teams[1].name}:** ${
				teamString[this.teams[1].id] || ""
			}
			`;

			embed.addField("Bans", banString);
		}
		// Handle Picks
		let picks = this.picks.sort((a, b) => a.pickNumber - b.pickNumber);

		if (this.teams[0].pick_order) {
			embed.addField(
				"First Pick",
				this.teams[this.teams[0].pick_order - 1].name
			);
			let pickString = ``;
			for (const pick of picks) {
				if (!pick.picked) return;
				let string = `${
					emotes.teams[pick.wonBy?.id] || emotes.loading
				} **${pick.identifier}**\n`;

				pickString += string;
			}
			embed.addField("Picks", pickString || "No picks yet");
		}

		if (state == 0) {
			description += `${emotes.loading} **${
				this.teams[this.waiting_on].name
			}** is currently picking.`;
			embed.setThumbnail(this.teams[this.waiting_on].icon_url);
		}

		// If no match link
		if (state == -1) {
			if (this.mp) {
				embed.addField("Previous MP Link: ", this.mp);
			}
			embed
				.setTitle(
					`ARCHIVED: ${this.round.acronym}: (${this.teams[0].name}) vs (${this.teams[1].name})`
				)
				.setColor("#AAAAAA")
				.setURL(null)
				.setDescription(
					stripIndents`
				**This match has been archived. Please select one of the options below to continue**
				
				**Recover Match:** I will ask for a new mp link from the players, and the match will start where it left off

				**Delete Match:** The match will be deleted, this message will be kept for reference`
				);
			embed.image = null;
			let recoverButton = new MessageButton()
				.setCustomId("start_match?id=" + this.id + "&recover=true")
				.setLabel("Recover Match")
				.setStyle("SUCCESS");
			let deleteButton = new MessageButton()
				.setCustomId("delete_match?id=" + this.id)
				.setLabel("Delete Match")
				.setStyle("DANGER");
			let components = new MessageActionRow().addComponents(
				recoverButton,
				deleteButton
			);
			await message.edit({
				content: null,
				embeds: [embed],
				components: [components],
			});
			return;
		}

		// Warmup Phase
		if (state == 4) {
			if (!this.waiting_on) return;
			if (this.beatmap == null) {
				embed.setDescription(
					`${this.teams[this.waiting_on].name} is picking a warmup`
				);
				embed.setThumbnail(this.teams[this.waiting_on].icon_url);
			} else {
				embed.setDescription(
					`**Warmup:** ${this.beatmap.artist} -  ${this.beatmap.title} [${this.beatmap.version}]`
				);
				embed.setImage(
					`https://assets.ppy.sh/beatmaps/${this.beatmap.setId}/covers/cover.jpg`
				);
			}
		}

		// Final Match Results
		if (state >= 8) {
			if (this.teams[0].score > this.teams[1].score) {
				embed.color = this.teams[0].color;
				embed.setThumbnail(this.teams[0].icon_url);
			}
			if (this.teams[0].score < this.teams[1].score) {
				description = `
					${emotes.teams[this.teams[0].id]} ${this.teams[0].name} | ${
					this.teams[0].score
				} - ${this.teams[1].score} | **${this.teams[1].name}** ${
					emotes.teams[this.teams[1].id]
				}`;
				embed.color = this.teams[1].color;
				embed.setThumbnail(this.teams[1].icon_url);
			}
			embed.setFooter(null);
			embed.setImage(null);
		}

		if (!(description == "")) {
			embed.setDescription(description);
		}
		await message.edit({ embeds: [embed] });
	}
}

module.exports.MatchManager = MatchManager;

function getMaxLength(obj, index) {
	let max = 0;
	for (const o of obj) {
		if (o[index].length > max) {
			max = o[index].length;
		}
	}
	return max;
}
