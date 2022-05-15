const { prisma } = require("../prisma");
const { bot: discord } = require("../discord");
const { Client } = require("nodesu");
const { MessageEmbed } = require("discord.js");
const { Team } = require("./Team");
const { stripIndents } = require("common-tags");
const { fetchChannel, fetchUser } = require("./client");

// State Enumeration
let states = {
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

		// Get mappool from DB
		this.mappool = await prisma.mapInMatch.findMany({
			where: {
				matchId: this.id,
			},
		});

		// Make team objects from db
		let dbTeams = await prisma.team.findMany({
			where: {
				TeamInMatch: {
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
					in_teams: {
						some: {
							teamId: team.id,
						},
					},
				},
			});
			let teamInMatch = await prisma.teamInMatch.findFirst({
				where: {
					teamId: team.id,
					matchId: this.id,
				},
			});
			let newTeam = new Team(this, team, users);
			await newTeam.setTeamInMatch(teamInMatch);
			this.teams.push(newTeam);
		}

		// Update state if no mp link
		if (!this.mp) {
			await this.updateState(3);
			await this.updateMessage();
			return;
		}

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
			await this.updateState(3);
			await this.updateMessage();
		}
		await this.lobby.clearHost();

		// Update db object
		await prisma.match.update({
			where: {
				id_roundId: {
					id: this.id,
					roundId: this.round.id,
				},
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
			this.tournament.XvX_mode * 2 + 1
		);

		// Do onJoin for players currently in the lobby
		let players = this.lobby.slots.filter((x) => x);
		for (let player of players) {
			await this.joinHandler({ player });
		}

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
		// Start Warmups
		this.init = true;
		if (this.state == 3) {
			await this.updateState(4);
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
		console.log(event);
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
				if (teamCount != this.tournament.XvX_mode) {
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
						? `${team.name} (${score})`
						: ` | ${team.name} (${score})`;
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

			let lastMap = await prisma.mapInMatch.findFirst({
				orderBy: {
					pickNumber: "desc",
				},
				where: {
					matchId: this.id,
					pickNumber: {
						not: null,
					},
				},
			});

			if (compareScore <= 0) {
				let winner = this.teams[1];
				await winner.addScore();
				await winner.addWin(lastMap.mapIdentifier);
			}

			if (compareScore >= 0) {
				let winner = this.teams[0];
				await winner.addScore();
				await winner.addWin(lastMap.mapIdentifier);
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
			let tiebreakers = await prisma.mapInMatch.findMany({
				where: {
					matchId: this.id,
					mapIdentifier: {
						contains: "TB",
					},
				},
			});
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

		// If current host is on warming up team, do nothing
		let team = this.teams[this.waiting_on];
		let host = this.lobby.getHost();
		let user = team.getUserPos(host?.user?.id);
		if (user != undefined || user != null) return;

		if (team.warmedUp) {
			await this.updateState(5);
			await this.roll();
			return;
		}

		let slots = this.lobby.slots.filter((slot) => slot);

		for (const player of team.players) {
			let slotMap = slots.map((slot) => slot?.user?.username);
			if (slotMap.includes(player.user.username)) {
				if (!this.lobby.freemod) {
					await this.lobby.setMods("Freemod");
				}
				await this.lobby.setHost(player.user.username);
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
		let teamRolls = await prisma.teamInMatch.findMany({
			where: {
				matchId: this.id,
			},
		});
		teamRolls = teamRolls.map((team) => team.roll);
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
		let team = this.teams[this.waiting_on];
		let user = team.getUserPos(msg.user.id);
		if (user == null) return;

		let command = msg.content.match(/^!skip/g);
		if (command) {
			let team = this.teams[this.waiting_on];
			await this.lobby.clearHost();
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
			if (team == null) return;

			if (team.roll == null) {
				await new Promise((resolve) =>
					setTimeout(resolve, prismaTimeout)
				);
				await prisma.teamInMatch.update({
					where: {
						teamId_matchId: {
							teamId: team.id,
							matchId: this.id,
						},
					},
					data: {
						roll: parseInt(roll.groups.roll),
					},
				});
				await new Promise((resolve) =>
					setTimeout(resolve, prismaTimeout)
				);
				let team = await prisma.team.findFirst({
					where: {
						id: team.id,
					},
				});

				await new Promise((resolve) =>
					setTimeout(resolve, prismaTimeout)
				);
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
		user = team.getUser(user);
		let command = msg.content.match(/!ban (?<map>\w+)/);

		let mapString = command.groups.map.toUpperCase();
		if (!command) return;
		let map = await prisma.mapInMatch.findFirst({
			where: {
				matchId: this.id,
				mapIdentifier: mapString,
			},
		});
		if (!map) {
			await this.channel.sendMessage(
				`Map ${command.groups.map} not found`
			);
			return;
		}

		// Check for double bans
		let otherBans = [];
		for (const ban of team.bans) {
			let map = await prisma.mapInPool.findFirst({
				where: {
					identifier: ban,
				},
			});
			otherBans.push(map);
		}
		let otherBanMods = otherBans.map((ban) => ban.mods);

		let mapMods = await prisma.mapInPool.findFirst({
			where: {
				InMatches: {
					some: {
						matchId: this.id,
					},
				},
				identifier: map.mapIdentifier,
			},
		});
		mapMods = mapMods.mods;
		if (
			(this.tournament.double_ban == 1 && mapMods != "") ||
			this.tournament.double_ban == 0
		) {
			if (otherBanMods.includes(mapMods)) {
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

		// If the map is already banned
		if (team.bans.includes(map.mapIdentifier)) {
			await this.channel.sendMessage(
				`${map.mapIdentifier} has already been chosen as a ban`
			);
			return;
		}

		await team.addBan(map.mapIdentifier);
		await this.channel.sendMessage(
			`${team.name} choose to ban ${map.mapIdentifier}`
		);
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
		user = team.getUser(user);
		let command = msg.content.match(/!pick (?<map>\w+)/);
		if (!command) return;

		let mapString = command.groups.map.toUpperCase();
		let map = await prisma.mapInMatch.findFirst({
			where: {
				matchId: this.id,
				mapIdentifier: mapString,
			},
		});

		if (!map) {
			await this.channel.sendMessage("Invalid map name");
			return;
		}

		let mapInPool = await prisma.mapInPool.findFirst({
			where: {
				Mappool: {
					Round: {
						id: this.round.id,
					},
				},
				identifier: map.mapIdentifier,
			},
		});

		// Check if banned
		if (map.bannedByTeamId) {
			await this.channel.sendMessage(
				`${mapInPool.identifier} was one of the bans`
			);
			return;
		}

		// Check for previous picks
		if (map.pickedByTeamId) {
			await this.channel.sendMessage(
				`${mapInPool.identifier} has already been picked`
			);
			return;
		}

		// Check for double picks
		let lastTeamPicks = await prisma.mapInMatch.findMany({
			where: {
				pickedByTeamId: team.id,
				matchId: this.id,
			},
			orderBy: {
				pickTeamNumber: "asc",
			},
		});

		let lastTeamPickMods = [];
		for (const pick of lastTeamPicks) {
			let map = await prisma.mapInPool.findFirst({
				where: {
					identifier: pick.mapIdentifier,
					InMatches: {
						some: {
							matchId: this.id,
						},
					},
				},
			});
			lastTeamPickMods.push(map.mods);
		}

		let lastTeamPick = lastTeamPickMods[lastTeamPicks.length - 1];

		if (
			(this.tournament.double_pick == 1 && lastTeamPick != "") ||
			this.tournament.double_pick == 0
		) {
			if (lastTeamPick == mapInPool.mods) {
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

		this.addPick(mapInPool);
		await this.channel.sendMessage(
			`${team.name} choose to pick ${map.mapIdentifier}`
		);
	}

	/**
	 * Picks a map in the lobby and adds it to the
	 * @param {import("@prisma/client").MapInPool} map
	 */
	async addPick(map) {
		let team = this.teams[this.waiting_on];
		await team.addPick(map.identifier);
		let globalPicks = await prisma.mapInMatch.findMany({
			where: {
				matchId: this.id,
				pickedByTeamId: {
					not: null,
				},
			},
		});
		let teamPicks = await prisma.mapInMatch.findMany({
			where: {
				matchId: this.id,
				pickedByTeamId: team.id,
			},
		});
		await prisma.mapInMatch.update({
			where: {
				mapIdentifier_matchId: {
					matchId: this.id,
					mapIdentifier: map.identifier,
				},
			},
			data: {
				pickNumber: globalPicks.length,
				pickTeamNumber: teamPicks.length,
			},
		});

		await this.lobby.setMap(map.mapId);
		if (this.tournament.force_nf) {
			if (!map.mods.includes("NF")) {
				map.mods += " NF";
			}
		}
		await this.lobby.setMods(map.mods);
		await this.updateState(1);
		// Ready Phase Command
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
				id_roundId: {
					id: this.id,
					roundId: this.round.id,
				},
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
				id_roundId: {
					id: this.id,
					roundId: this.round.id,
				},
			},
			data: {
				state: state,
			},
		});

		await this.updateMessage();
		console.log(`Match ${this.id} state updated to ${states[state]}`);
	}

	async msgHandler(msg) {
		if (msg.self) return;
		console.log(
			`[${msg.channel.name}] ${msg.user.ircUsername} >> ${msg.message}`
		);

		// this.msgListener(msg);

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
	 * @param {number} state Mimics the state of the match
	 * @private
	 */
	async updateMessage(state) {
		state = state || this.state;

		let emoteEnum = {};
		emoteEnum[this.teams[0].id] = ":red_square:";
		emoteEnum[this.teams[1].id] = ":blue_square:";

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
			.setFooter({ text: "Current phase: " + states[this.state] });

		if (state <= 2 || (state >= 5 && state <= 8)) {
			description += `
				${emoteEnum[this.teams[0].id]} ${this.teams[0].name} | ${
				this.teams[0].score
			} - ${this.teams[1].score} | ${this.teams[1].name} ${
				emoteEnum[this.teams[1].id]
			}\n`;
		}

		if (state >= 5 && state <= 7) {
			let teamsInMatch = await prisma.teamInMatch.findMany({
				where: {
					matchId: this.id,
				},
			});
			description += "\n";

			for (const team of this.teams) {
				if (team.roll == null) return;

				description += `**${team.name}** rolled a **${team.roll}**\n`;
			}
		}
		if (this.beatmap) {
			embed.setImage(
				`https://assets.ppy.sh/beatmaps/${this.beatmap?.setId}/covers/cover.jpg`
			);
		}

		// Handle bans
		let bans = await prisma.mapInMatch.findMany({
			where: {
				bannedByTeamId: {
					not: null,
				},
				Match: {
					id: this.id,
				},
			},
		});
		if (bans.length > 0) {
			let banString = "";
			let teamString = {};
			for (const ban of bans) {
				if (!ban.bannedByTeamId) return;
				let string =
					teamString[ban.bannedByTeamId] == null
						? `${ban.mapIdentifier}`
						: `, ${ban.mapIdentifier}`;

				teamString[ban.bannedByTeamId] =
					teamString[ban.bannedByTeamId] == null
						? string
						: (teamString[ban.bannedByTeamId] += string);
			}

			banString = `
				${emoteEnum[this.teams[0].id]} **${this.teams[0].name}:** ${
				teamString[this.teams[0].id] || ""
			}
				${emoteEnum[this.teams[1].id]} **${this.teams[1].name}:** ${
				teamString[this.teams[1].id] || ""
			}
			`;

			embed.addField("Bans", banString);
		}
		// Handle Picks
		let picks = await prisma.mapInMatch.findMany({
			where: {
				pickedByTeamId: {
					not: null,
				},
				Match: {
					id: this.id,
				},
			},
			orderBy: {
				pickNumber: "asc",
			},
		});

		if (this.teams[0].pick_order) {
			embed.addField(
				"First Pick",
				this.teams[this.teams[0].pick_order - 1].name
			);
			let pickString = ``;
			for (const pick of picks) {
				if (!pick.pickedByTeamId) return;
				let string = `${
					emoteEnum[pick.wonByTeamId] ||
					"<a:loading:970406520124764200>"
				} **${pick.mapIdentifier}**\n`;

				pickString += string;
			}
			embed.addField("Picks", pickString || "No picks yet");
		}

		if (state == 0) {
			description += `<a:loading:970406520124764200> **${
				this.teams[this.waiting_on].name
			}** is currently picking.`;
			embed.setThumbnail(this.teams[this.waiting_on].icon_url);
		}

		if (state == 3) {
			embed
				.setColor("RED")
				.setURL(null)
				.setDescription(
					`
            Uh oh!
			We had some trouble finding the link to your match.
			Here are the steps to create a new one:
            `
				)
				.addField(
					"Create the match",
					stripIndents`
                Select one member of your match to make the lobby, by sending a DM to \`BanchoBot\` on osu:
                \`\`\`
                !mp make ${this.tournament.acronym}: (${this.teams[0].name}) vs (${this.teams[1].name})
                \`\`\`
            `
				)
				.addField(
					"Add yagami as a ref",
					stripIndents`
                Add the bot as a ref to your match:
                \`\`\`
                !mp addref ${process.env.banchoUsername}
                \`\`\`
            `
				)
				.addField(
					"Point the bot to the match",
					stripIndents`
                Get the link to your match and paste it into the \`/match addlink\` command in this server
                \`\`\`
                /match addlink link:https://osu.ppy.sh/...
				\`\`\`
            `
				);
		}

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

		if (state >= 8) {
			if (this.teams[0].score > this.teams[1].score) {
				description = `
					${emoteEnum[this.teams[0].id]} **${this.teams[0].name}** | ${
					this.teams[0].score
				} - ${this.teams[1].score} | ${this.teams[1].name} ${
					emoteEnum[this.teams[1].id]
				}`;
				embed.color = this.teams[0].color;
				embed.setThumbnail(this.teams[0].icon_url);
			}
			if (this.teams[0].score < this.teams[1].score) {
				description = `
					${emoteEnum[this.teams[0].id]} ${this.teams[0].name} | ${
					this.teams[0].score
				} - ${this.teams[1].score} | **${this.teams[1].name}** ${
					emoteEnum[this.teams[1].id]
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
