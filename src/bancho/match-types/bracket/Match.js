const { prisma } = require("../../../prisma");
const { bot: discord } = require("../../../discord");
const { Client } = require("nodesu");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
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

// Mods that count as a "User with a mod" in FM rules
let allowedFMMods = ["ez", "hd", "hr", "fl"];
let maxWarmupLength = 300;
let maxAborts = 1;

let timers = {
	0: 120,
	1: 120,
	4: 180,
	6: 90,
	7: 120,
};

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
		this.swaps = [];

		this.partials = {
			choosing: false,
			banning: false,
			picking: false,
			readying: false,
		};
	}

	/*
	 * ==============================================
	 *
	 *                 MATCH CREATION
	 *
	 * ==============================================
	 */
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

		let channel = await discord.channels.fetch(this.channel_id);
		/**
		 * @type {import("discord.js").Message}
		 */
		this.message = await channel.messages.fetch(this.message_id);

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
		/**
		 * @type {Map[]}
		 */
		this.wins = [];
		let mappool = await prisma.mapInMatch.findMany({
			where: {
				matchId: this.id,
			},
			orderBy: {
				Map: {
					modPriority: "asc",
				},
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
			// Give picks, bans, and wins to teams
			if (mapObj.banned) {
				this.bans.push(mapObj);
				await mapObj.bannedBy.addBan(mapObj);
			}
			if (mapObj.picked) {
				this.picks.push(mapObj);
				await mapObj.pickedBy.addPick(mapObj);
			}
			if (mapObj.won) {
				this.wins.push(mapObj);
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
		this.lastGameData = lastGame;

		// Setup channel
		/**
		 * @type {import("bancho.js").BanchoMultiplayerChannel}
		 */
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
		await this.lobby.abortTimer();
		await this.lobby.lockSlots();

		let lobbyTitle = `${this.tournament.acronym}: (${this.teams[0].name}) vs (${this.teams[1].name})`;
		await this.channel.sendMessage(`!mp name ${lobbyTitle}`);

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
		this.lobbySettings = {
			team_mode: this.tournament.team_mode,
			score_mode:
				this.tournament.score_mode == 4
					? 3
					: this.tournament.score_mode,
			slots: this.tournament.team_size * 2 + 1,
		};
		if (this.lobbySettings.slots > 16) this.lobbySettings.slots = 16;

		this.beatmap = this.lobby.beatmap;

		let { team_mode, score_mode, slots } = this.lobbySettings;
		await this.lobby.setSettings(team_mode, score_mode, slots);

		// Do onJoin for players currently in the lobby
		let players = this.lobby.slots.filter((x) => x);
		for (let player of players) {
			await this.joinHandler({ player });
		}

		this.init = true;

		// Send invites to players outside of the lobby
		let invitesToIgnore = players
			.filter((player) => player)
			.map((player) => player.user.username);

		for (const team of this.teams) {
			let users = team.users;

			for (const user of users) {
				if (!invitesToIgnore.includes(user.osu_username)) {
					await this.invitePlayer(`#${user.osu_id}`);
				}
			}
		}

		this.swapping = true;
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

		// Smaller event handlers without their own function:
		this.lobby.on("matchStarted", async () => {
			if (this.state == 4 && this.beatmap.hitLength > maxWarmupLength) {
				let team = this.teams[this.waiting_on];
				setTimeout(async () => {
					await this.lobby.abortMatch();
					await team.setWarmedUp(true);
					await this.updateWaitingOn(1 - this.waiting_on);
					await this.warmup();
				}, 10000);
			}

			if (this.state == 4) {
				await this.abortTimer();
			}
		});

		this.lobby.on("playerLeft", async () => {
			await this.updateMessage();
		});

		this.swap();

		// Start Warmups
		if (this.state == 3) {
			await this.updateState(4);
			await this.warmup();
			return;
		}

		await this.recover();
		await this.updateMessage();
	}

	/*
	 * ==============================================
	 *
	 *                EVENT HANDLERS
	 *
	 * ==============================================
	 */

	/**
	 *
	 * @param {import("bancho.js").BanchoLobbyPlayer} event
	 */
	async joinHandler(event) {
		let user;
		/**
		 * @type {Team}
		 */
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
			return;
		}

		// Put the user on the right te
		if ([2, 3].includes(this.tournament.team_mode)) {
			if (team == this.teams[0]) {
				await this.lobby.changeTeam(event.player, "Red");
			}
			if (team == this.teams[1]) {
				await this.lobby.changeTeam(event.player, "Blue");
			}
		}

		// Get users from the team that are already in the lobby
		let userMap = team.users.map((x) => x.osu_id);
		let inLobbyPlayers = this.lobby.slots
			.filter((x) => x)
			.filter((x) => userMap.includes(x.user.id));

		// If the team has max players, kick the user
		if (
			inLobbyPlayers.length > this.tournament.x_v_x_mode &&
			this.state != 4
		) {
			return;
		}

		let slot = inLobbyPlayers.length;
		let teamIndex = this.teams.indexOf(team);

		// Move the player to the lower slots if team 2
		if (teamIndex == 1) {
			slot += this.tournament.x_v_x_mode;
		}
		let teamSlots = [];
		for (
			let i = 1 + this.tournament.x_v_x_mode * teamIndex;
			i < this.tournament.x_v_x_mode;
			i++
		) {
			teamSlots.push(i);
		}

		if (slot && !teamSlots.includes(slot))
			this.swaps.push({ player: event.player, slot });

		if (!this.swapping) {
			await this.swap();
		}

		if (this.state == 4 && this.init) {
			await this.warmup();
		}
		await this.updateMessage();
	}

	async readyHandler() {
		if (this.partials.readying) return;

		if (this.state == 4) {
			this.partials.readying = true;
			await this.channel.sendMessage("All players ready!");
			await this.lobby.startMatch(5);
			this.partials.readying = false;
			return;
		}
		if (this.state == 1) {
			this.partials.readying = true;
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
				this.partials.readying = false;
				return;
			}

			let freemod = this.picks[this.picks.length - 1].mods
				.toUpperCase()
				.includes("FREEMOD");
			if (freemod) {
				await this.lobby.updateSettings();
				if (this.tournament.force_nf) {
					let noNF = [];
					for (const player of this.lobby.slots) {
						if (!player) continue;

						let nf =
							player.mods.filter((x) => x.shortMod == "nf")
								.length == 0;
						if (nf) {
							noNF.push(player.user.username);
						}
					}

					if (noNF.length > 0) {
						let noNFString = "";
						for (const user of noNF) {
							noNFString +=
								noNFString == "" ? `${user}` : `, ${user}`;
						}
						await this.channel.sendMessage(
							`The following players do not have the NF mod: ${noNFString}`
						);
						this.partials.readying = false;
						return;
					}
				}

				let freemodCount = {};
				for (const team of this.teams) {
					let teamIndex = this.teams.indexOf(team);
					for (const slot of this.lobby.slots) {
						if (!slot) continue;

						let userMap = team.users.map((x) => x.osu_username);
						if (userMap.includes(slot.user.username)) {
							let modMap = slot.mods.map((x) => x.shortMod);
							if (modMap.some((x) => allowedFMMods.includes(x))) {
								freemodCount[teamIndex] =
									freemodCount[teamIndex] == null
										? 1
										: freemodCount[teamIndex] + 1;
							}
						}
					}
					if (freemodCount[teamIndex] == null) {
						freemodCount[teamIndex] = 0;
					}
				}

				for (const key in freemodCount) {
					let teamCount = freemodCount[key];
					if (teamCount < this.tournament.fm_mods) {
						badTeams.push(key);
					}
				}

				if (badTeams.length >= 1) {
					let teamString = "";
					for (const team of badTeams) {
						teamString += this.teams[team].name + " ";
					}
					await this.channel.sendMessage(
						`The following teams do not meet FM requirements: ${teamString}`
					);
					let s = this.tournament.fm_mods == 1 ? "" : "s";
					await this.channel.sendMessage(
						`Teams must have at least ${this.tournament.fm_mods} player${s} with a mod`
					);
					this.partials.readying = false;
					return;
				}
			}

			this.abortAllowed = true;
			setTimeout(() => (this.abortAllowed = false), 35 * 1000);

			await this.abortTimer(false);
			await this.updateState(2);
			await this.lobby.startMatch(5);
			await this.channel.sendMessage("glhf!");
			this.partials.readying = false;
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

				if ([2, 4].includes(this.tournament.score_mode)) {
					score =
						((score * 100) / this.tournament.x_v_x_mode).toFixed(
							3
						) + "%";
				}
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
				this.wins.push(lastMap);
			}

			if (compareScore >= 0) {
				let winner = this.teams[0];
				await winner.addScore();
				await winner.addWin(lastMap);
				this.wins.push(lastMap);
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
					setTimeout(async () => {
						await this.lobby.closeLobby();
						await this.updateState(9);
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
					let tb = this.mappool.filter((x) =>
						x.identifier.toUpperCase().includes("TB")
					);
					await this.addPick(tb[0]);
					await this.updateState(1);
					return;
				}
			}

			await this.updateWaitingOn(1 - this.waiting_on);
			await this.updateState(0);
			await this.pickPhase();
		}
	}

	/**
	 *
	 * @param {import("nodesu").Beatmap} beatmap
	 */
	async beatmapHandler(beatmap) {
		this.beatmap = beatmap;
		await this.updateMessage();
		if (!beatmap) return;
		if (this.state == 4) {
			if (beatmap.hitLength > maxWarmupLength) {
				await this.channel.sendMessage(
					`Your warmup map must be shorter than ${maxWarmupLength} seconds. If the match is started, the match will be aborted and you will lose your warmup.`
				);
				return;
			}
			await this.channel.sendMessage(
				`[https://osu.ppy.sh/b/${beatmap.beatmapId} ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]] - [https://beatconnect.io/b/${beatmap.beatmapset_id} Beatconnect Mirror] - [https://api.chimu.moe/v1/download/${beatmap.beatmapset_id} chimu.moe Mirror]`
			);
		}
	}

	/*
	 * ==============================================
	 *
	 *                PHASE FUNCTIONS
	 *
	 * ==============================================
	 */
	async warmup() {
		if (this.waiting_on == null) {
			await this.updateWaitingOn(0);
		}
		let team = this.teams[this.waiting_on];

		if (team.warmed_up) {
			await this.lobby.clearHost();
			await this.updateState(5);
			let { team_mode, score_mode, slots } = this.lobbySettings;
			await this.lobby.setSettings(team_mode, score_mode, slots);
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
					`You have ${
						timers[this.state] / 60
					} minutes to start the warmup`
				);
				await this.startTimer(timers[this.state]);
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
			return;
		}

		if (!teamRolls.includes(null)) {
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

		let banOrderChosen = team.ban_order != null || this.round.bans == 0;
		let pickOrderChosen = team.pick_order != null;
		if (banOrderChosen && pickOrderChosen) {
			if (team.ban_order == 1) {
				await this.updateWaitingOn(this.teams.indexOf(team));
			} else {
				await this.updateWaitingOn(1 - this.teams.indexOf(team));
			}
			await this.updateState(7);
			await this.banPhase();
			return;
		}
		let typeOption = "[pick|ban]";
		if (this.round.bans == 0) {
			typeOption = "pick";
		}

		await this.channel.sendMessage(
			`${team.name}, it is your turn to pick! Use "!choose [first|second] ${typeOption}" to choose the order`
		);
		await this.startTimer();
	}

	async banPhase() {
		let team = this.teams[this.waiting_on];
		if (team.bans.length >= this.round.bans) {
			// If team 0 is the first picker, 1 - 1 = 0:
			// If team 1 is the first picker, 2 - 1 = 1:
			let firstPicker = this.teams[0].pick_order - 1;
			await this.updateWaitingOn(firstPicker);
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
		await this.startTimer();
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
			`${this.teams[0].name} | ${this.teams[0].score} - ${this.teams[1].score} | ${this.teams[1].name} // ${bestOfPhrase} // Next pick: ${team.name}`
		);
		await this.channel.sendMessage("Use !pick [map] to pick a map");
		await this.startTimer();
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
			await this.lobby.setSize(16);
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
			await this.lobby.closeLobby();
			await this.updateState(9);
			return;
		}
	}

	/*
	 * ==============================================
	 *
	 *           PHASE MESSAGE LISTENERS
	 *
	 * ==============================================
	 */

	async warmupListener(msg) {
		if (this.waiting_on == null) return;
		let team = this.teams[this.waiting_on];
		let user = team.getUserPos(msg.user.id);
		if (user == null) return;

		let command = msg.message.match(/^!skip/g);
		if (command) {
			let team = this.teams[this.waiting_on];
			await team.setWarmedUp(true);
			await this.abortTimer(true);
			await this.updateWaitingOn(1 - this.waiting_on);
			await this.warmup();
		}
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async rollListener(msg) {
		if (msg.message.toLowerCase() == "!roll") {
			let username = msg.user.ircUsername.replace(" ", "_");
			this.rollVerification[username] = true;
			return;
		}

		if (msg.user.ircUsername != "BanchoBot") return;

		let content = msg.message;
		let roll = content.match(/(?<user>.+) rolls (?<roll>\d+) point\(s\)/);
		if (!roll) return;

		let username = roll.groups.user.replaceAll(" ", "_");

		if (this.rollVerification[username]) {
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
				await this.updateMessage();
			}
		}
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 * @returns
	 */
	async chooseListener(msg) {
		if (this.partials.choosing) return;

		let team = this.teams[this.waiting_on];
		let user = team.getUserPos(msg.user.id);
		user = team.getUser(user);
		if (user == null) return;
		let command = msg.message.match(
			/!choose (?<order>first|second) (?<type>pick|ban)/
		);
		if (!command && msg.message.startsWith("!choose")) {
			await this.channel.sendMessage(
				"Invalid command usage! Correct Usage: !choose [first|second] [pick|ban]"
			);
		}
		if (!command) return;
		this.partials.choosing = true;
		if (
			this.round.bans == 0 &&
			command.groups.type.toLowerCase() == "ban"
		) {
			await this.channel.sendMessage(
				"There are no bans in this round, so you can't choose the ban order"
			);
			return;
		}

		if (command.groups.type.toLowerCase() == "pick") {
			if (team.pick_order) {
				await this.channel.sendMessage(
					`The pick order has already been chosen`
				);
				this.partials.choosing = false;
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
			this.partials.choosing = false;
			await this.updateWaitingOn(1 - this.waiting_on);
			await this.chooseOrder();
		}

		if (command.groups.type.toLowerCase() == "ban") {
			if (team.ban_order) {
				await this.channel.sendMessage(
					`The ban order has already been chosen`
				);
				this.partials.choosing = false;
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
			this.partials.choosing = false;
		}
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 * @returns
	 */
	async banListener(msg) {
		if (this.partials.banning) return;

		let team = this.teams[this.waiting_on];
		let user = team.getUserPos(msg.user.id);

		if (user == null) return;
		let command = msg.message.match(/!ban (?<map>\w+)/);

		if (!command) return;
		this.partials.banning = true;
		let mapString = command.groups.map.toUpperCase();
		let map = this.mappool.find((x) => x.identifier == mapString);

		if (!map) {
			await this.channel.sendMessage(
				`Map ${command.groups.map} not found`
			);
			this.partials.banning = false;
			return;
		}

		// If the map is already banned
		if (map.banned) {
			await this.channel.sendMessage(
				`${map.identifier} has already been chosen as a ban`
			);
			this.partials.banning = false;
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
				this.partials.banning = false;
				return;
			}
		}

		// If the team tried to ban the TB
		if (command.groups.map.substring(0, 2).toLowerCase() == "tb") {
			await this.channel.sendMessage(
				`Silly goose! The tiebreaker is unbannable.`
			);
			this.partials.banning = false;
			return;
		}

		await this.abortTimer(false);
		this.bans.push(map);
		await team.addBan(map);
		await this.channel.sendMessage(
			`${team.name} chooses to ban ${map.identifier}`
		);
		await this.updateMessage();
		await this.updateWaitingOn(1 - this.waiting_on);
		await this.banPhase();
		this.partials.banning = false;
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async pickListener(msg) {
		if (this.partials.picking) return;

		let team = this.teams[this.waiting_on];
		let user = team.getUserPos(msg.user.id);

		if (user == null) return;
		let command = msg.message.match(/!pick (?<map>\w+)/);

		if (!command) return;
		this.partials.picking = true;
		let mapString = command.groups.map.toUpperCase();
		let map = this.mappool.find((x) => x.identifier == mapString);

		if (!map) {
			await this.channel.sendMessage("Invalid map name");
			this.partials.picking = false;
			return;
		}

		// Check if banned
		if (map.banned) {
			await this.channel.sendMessage(
				`${map.identifier} was one of the bans`
			);
			this.partials.picking = false;
			return;
		}

		// Check for previous picks
		if (map.picked) {
			await this.channel.sendMessage(
				`${map.identifier} has already been picked`
			);
			this.partials.picking = false;
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
				this.partials.picking = false;
				return;
			}
		}

		// If the team tried to pick the TB
		if (command.groups.map.substring(0, 2).toLowerCase() == "tb") {
			await this.channel.sendMessage(
				"Silly goose! The tiebreaker is unpickable."
			);
			this.partials.picking = false;
			return;
		}

		await this.abortTimer(false);
		await this.addPick(map);
		this.partials.picking = false;
		await this.channel.sendMessage(
			`${team.name} chooses ${map.identifier} | [https://osu.ppy.sh/b/${map.beatmapId} ${map.artist} - ${map.title} [${map.version}]] - [https://beatconnect.io/b/${map.beatmapset_id} Beatconnect Mirror] - [https://api.chimu.moe/v1/download/${map.beatmapset_id} chimu.moe Mirror]`
		);
	}

	/*
	 * ==============================================
	 *
	 *                MATCH COMMANDS
	 *
	 * ==============================================
	 */

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async listCommand(msg) {
		let command = msg.message.match(/^!list/g);
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
		let command = msg.message.match(/^!bans/g);
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
		let command = msg.message.match(/^!score/g);
		if (!command) return;

		let team = this.teams[this.waiting_on];
		let bestOfPhrase = `Best of ${this.round.best_of}`;
		for (const team of this.teams) {
			if (team.score == (this.round.best_of - 1) / 2) {
				bestOfPhrase = `Match Point: ${team.name}`;
			}
		}

		await this.channel.sendMessage(
			`${this.teams[0].name} | ${this.teams[0].score} - ${this.teams[1].score} | ${this.teams[1].name} // ${bestOfPhrase} // Next pick: ${team.name}`
		);
	}
	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async abortCommand(msg) {
		let command = msg.message.match(/^!abort/g);
		if (!command || !this.abortAllowed) return;

		let team;
		for (const teamTest of this.teams) {
			let userList = teamTest.users.map((user) => user.osu_username);
			if (userList.includes(msg.user.username)) {
				team = teamTest;
			}
		}
		if (!team || team.aborts >= maxAborts) return;

		await this.lobby.abortMatch();
		await this.updateState(1);
		await team.addAbort();
		await this.channel.sendMessage(`${team.name} has aborted the match`);
	}

	/*
	 * ==============================================
	 *
	 *                STATE UPDATERS
	 *
	 * ==============================================
	 */

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
		await this.startTimer();
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
	 */
	async swap() {
		if (this.swaps.length == 0 || this.state == 2) {
			this.swapping = false;
			return;
		}
		this.swapping = true;
		let swap = this.swaps[0];
		/**
		 * @type {import("bancho.js").BanchoLobbyPlayer}
		 */
		let player = swap.player;
		/**
		 * @type {number}
		 * Decrease slot by 1 because the array is 0-indexed
		 */
		let slot = swap.slot - 1;

		let slotMap = this.lobby.slots.map((x) => x?.user?.id);
		let playerSlot = slotMap.indexOf(player.user.id);

		let slots = this.lobby.slots;

		if (playerSlot != slot) {
			if (slots[slot] == null) {
				await this.lobby.movePlayer(player, slot);
			}

			if (slots[slot] != null) {
				let player2 = slots[slot];
				let swapSlot = this.tournament.x_v_x_mode * 2;
				await this.lobby.movePlayer(player2, swapSlot);
				await this.lobby.movePlayer(player, slot);
				await this.lobby.movePlayer(player2, playerSlot);
			}
		}

		this.swaps.splice(0, 1);
		await this.swap();
	}
	/**
	 *
	 * @param {number} num The team that you're waiting on
	 * @private
	 */
	async updateWaitingOn(num) {
		this.waiting_on = num;
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
		if (msg.message.match(/^!mp close/g)) {
			await this.updateState(-1);
			return;
		}

		if (msg.message.match(/^!mp removeref/g)) {
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

		// Check for timer warning
		if (
			msg.message == "Countdown ends in 30 seconds" &&
			msg.user.ircUsername == "BanchoBot"
		) {
			await this.timerHandler(true);
			return;
		}

		// Check for ref abuse
		if (msg.message.match(/^!mp/g)) {
			if (msg.message.match(/^!mp timer/g)) {
				this.lastTimer = Date.now();
				await this.abortTimer();
			}
			await this.channel.sendMessage(
				"Leave the mp commands alone. I've got it covered. Too much abuse of mp commands will result in an automatic forfeit"
			);
		}

		if (msg.message.match(/^!mp timer|^!mp aborttimer/g)) {
			let team;
			for (const teamTest of this.teams) {
				if (teamTest.users.find((u) => u.osu_id == msg.user.id)) {
					team = teamTest;
				}
			}

			if (team == this.teams[this.waiting_on] && timers[this.state]) {
				await this.channel.sendMessage(
					"You have lost your priority for doing that."
				);
				await this.timerHandler(false, true);
				return;
			}
			await this.startTimer();
			return;
		}

		if ((this.state >= 0 && this.state <= 2) || this.state == 7) {
			await this.listCommand(msg);
			await this.bansCommand(msg);
		}
		if (this.state >= 0 && this.state <= 2) {
			await this.scoreCommand(msg);
		}

		if (this.state == 2) {
			await this.abortCommand(msg);
			return;
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

	async startTimer() {
		clearTimeout(this.timer);
		let timerLength = timers[this.state];
		await this.lobby.startTimer(timerLength);
		this.timer = setTimeout(() => {
			this.timerHandler();
		}, (timerLength + 5) * 1000);
		this.lastTimer = Date.now();
	}

	async abortTimer(inMatch) {
		if (inMatch) await this.lobby.abortTimer();
		clearTimeout(this.timer);
	}

	async timerHandler(warn, excludeMessage) {
		let team = this.teams[this.waiting_on];

		let stateEnum = {
			0: "pick",
			4: "choose a warmup",
			5: "roll",
			6: "choose",
			7: "ban",
		};

		let stateText = stateEnum[this.state];
		if (!stateText) return;

		if (warn) {
			await this.channel.sendMessage(
				`⚠ WARNING ⚠ ${team.name} will lose their priority to ${stateText} in 30 seconds.`
			);
			return;
		}

		await this.updateWaitingOn(1 - this.waiting_on);
		if (!excludeMessage) {
			await this.channel.sendMessage(
				`${team.name} took too long to ${stateText}!`
			);
		}

		if (this.state == 4) {
			await team.setWarmedUp(true);
		}

		await this.recover();
	}

	/*
	 * ==============================================
	 *
	 *            UPDATE MESSAGE FUNCTION
	 *
	 * ==============================================
	 */

	/**
	 * Updates the log message
	 * @function
	 * @private
	 */
	async updateMessage() {
		let state = this.state;

		let emotes = {
			teams: {
				[this.teams[0].id]: ":red_square:",
				[this.teams[1].id]: ":blue_square:",
			},
			grades: {
				SSH: "<:rank_SSH:979114277929631764>",
				SS: "<:rank_SS:979114272955179069>",
				SH: "<:rank_SH:979114267850727465>",
				S: "<:rank_S:979114262502973450>",
				A: "<:rank_A:979114140465516645>",
				B: "<:rank_B:979114234233372752>",
				C: "<:rank_C:979114239736299570>",
				D: "<:rank_D:979114244777857096>",
				F: "<:rank_F:979114251337744504>",
			},
			loading: "<a:loading:970406520124764200>",
		};

		let channel = await discord.channels.fetch(this.channel_id);
		/**
		 * @type {import("discord.js").Message}
		 */
		let message = await channel.messages.fetch(this.message_id);
		let oldembed = message.embeds[0];
		let description = "";
		let embed = new EmbedBuilder()
			.setTitle(
				`${this.round.acronym}: (${this.teams[0].name}) vs (${this.teams[1].name})`
			)
			.setColor(this.tournament.color)
			.setAuthor(oldembed.author)
			.setThumbnail(oldembed.thumbnail?.url)
			.setURL(this.mp)
			.setImage(oldembed.image?.url)
			.setFooter({ text: "Current phase: " + states[this.state] })
			.setTimestamp();

		// Score line
		if (state <= 2 || (state >= 5 && state <= 7)) {
			embed.addFields({
				name: "Score",
				value: `
				${emotes.teams[this.teams[0].id]} ${this.teams[0].name} | ${
					this.teams[0].score
				} - ${this.teams[1].score} | ${this.teams[1].name} ${
					emotes.teams[this.teams[1].id]
				}`,
			});
		}

		// Remove img on setup phases
		if ([3, 5, 6, 7].includes(state)) {
			embed.image = null;
		}

		// Individual Score Table
		if (
			([4, 5, 6, 7].includes(state) || this.wins.length >= 1) &&
			![1, 9].includes(state) &&
			this.lastGameData
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
					`${mods == [""] ? "" : "+" + mods.join("")}`,
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

		// Lobby Player List
		if (this.state == 1) {
			let leaderboard = "";

			let players = this.lobby.slots
				.filter((x) => x)
				.map((x) => x.user.username);
			for (const team of this.teams) {
				let inLobbyPlayers = team.users.filter((x) =>
					players.includes(x.osu_username)
				);

				leaderboard += `${emotes.teams[team.id]} **${team.name}**\n`;
				for (const user of inLobbyPlayers) {
					leaderboard += `\`${user.osu_username}\`\n`;
				}
				leaderboard += "\n";
			}
			description += "\n" + leaderboard;
		}

		// Match In Progress
		if (state == 2) {
			description += `\n${emotes.loading} **Map in progress**: ${
				this.picks[this.picks.length - 1].identifier
			}`;
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

			embed.addFields({ name: "Bans", value: banString });
		}
		// Handle Picks
		let picks = this.picks.sort((a, b) => a.pickNumber - b.pickNumber);

		if (this.teams[0].pick_order) {
			embed.addFields({
				name: "First Pick",
				value: this.teams[this.teams[0].pick_order - 1].name,
			});
			let pickString = ``;
			for (const pick of picks) {
				if (!pick.picked) return;
				let string = `${
					emotes.teams[pick.wonBy?.id] || emotes.loading
				} **${pick.identifier}**\n`;

				pickString += string;
			}
			embed.addFields({
				name: "Picks",
				value: pickString || "No picks yet",
			});
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
				embed.addFields({ name: "Previous MP Link: ", value: this.mp });
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
			let recoverButton = new ButtonBuilder()
				.setCustomId("start_match?id=" + this.id + "&recover=true")
				.setLabel("Recover Match")
				.setStyle("SUCCESS");
			let deleteButton = new ButtonBuilder()
				.setCustomId("delete_match?id=" + this.id)
				.setLabel("Delete Match")
				.setStyle("DANGER");
			let components = new ActionRowBuilder().addComponents(
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
		if (state == 9) {
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
		await this.message.edit({ embeds: [embed] });
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
