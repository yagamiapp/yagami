const { prisma } = require("../prisma");
const { bot: discord } = require("../discord");
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
		module.exports[`match_${id}`] = this;
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

		// Get tound from DB
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
		this.mappool = await prisma.map.findMany({
			where: {
				Round: {
					id: this.round.id,
				},
			},
		});

		// Make team objects from db
		let dbTeams = await prisma.team.findMany({
			where: {
				TeamInMatch: {
					some: {
						match_id: this.id,
					},
				},
			},
		});

		// Create teams and invite absent players
		/**
		 * @type {Team[]}
		 */
		this.teams = [];
		for (let team of dbTeams) {
			let users = await prisma.user.findMany({
				where: {
					in_teams: {
						some: {
							team_id: team.id,
						},
					},
				},
			});
			let teamInMatch = await prisma.teamInMatch.findFirst({
				where: {
					team_id: team.id,
				},
			});
			let newTeam = new Team(this, team, users);
			await newTeam.setScore(teamInMatch.score);
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
			this.tournament.score_mode,
			this.tournament.XvX_mode * 2 + 1
		);

		// Do onJoin for players currently in the lobby
		let players = this.lobby.slots;
		for (let player of players) {
			if (!player) continue;
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
		if (!user) {
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
	}

	async finishHandler() {
		if (this.state == 4) {
			if (this.waiting_on == 0) {
				await this.updateWaitingOn(1);
				await this.warmup();
				return;
			}
			if (this.waiting_on == 1) {
				await this.updateState(5);
				await this.lobby.clearHost();
				await this.lobby.updateSettings();
				this.roll();
				return;
			}
		}
	}

	async beatmapHandler(beatmap) {
		this.beatmap = beatmap;
		await this.updateMessage();
		if (this.state == 4) {
		}
	}

	async warmup() {
		if (!this.waiting_on) {
			await this.updateWaitingOn(0);
		}
		// Don't warmup if current host is on the correct team or
		// if the lobby is in progress
		let host = this.lobby.getHost()?.user?.username;
		let teamList = this.teams[this.waiting_on].players.map(
			(player) => player.user.username
		);
		if (teamList.includes(host) || this.lobby.playing) return;

		let team = this.teams[this.waiting_on];
		let slots = this.lobby.slots.filter((slot) => slot);

		for (const player of team.players) {
			let slotMap = slots.map((slot) => slot?.user?.username);
			if (slotMap.includes(player.user.username)) {
				await this.lobby.setMods("Freemod");
				await this.lobby.setHost(player.user.username);
				await this.channel.sendMessage(
					`${player.user.username} has been selected to choose the warmup. Use !skip to skip your warmup`
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
				match_id: this.id,
			},
		});
		teamRolls = teamRolls.map((team) => team.roll);
		console.log(teamRolls);
		// If both rolls are null
		if (teamRolls.filter((team) => team).length == 0) {
			await this.channel.sendMessage(
				"It's time to roll! I'll count the first roll from any player on each team."
			);
			this.channel.on("message", async (msg) => {
				await this.rollListener(msg);
			});
			await this.updateMessage();
			return;
		}

		if (!teamRolls.includes(null)) {
			console.log("Checking rolls");
			await this.updateMessage();

			// Check if all elements in array are the same
			let rolls = [...new Set(teamRolls)];
			if (rolls.length == 1) {
				await this.channel.sendMessage(
					`Wow, a roll tie! Let's try again.`
				);
				await prisma.teamInMatch.updateMany({
					where: {
						match_id: this.id,
					},
					data: {
						roll: null,
					},
				});
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
			this.updateState(7);
			// Ban Phase Method
			return;
		}

		await this.channel.sendMessage(
			`${team.name}, it is your turn to pick! Use !choose [first|second] [pick|ban] to choose your order`
		);
	}

	async recover() {
		if (this.state == 4) {
			this.warmup();
			return;
		}
		if (this.state == 5) {
			this.roll();
			return;
		}

		if (this.state == 6) {
			this.chooseOrder();
			return;
		}
	}

	async invitePlayer(name) {
		let user = await fetchUser(name);
		await user.sendMessage(
			"Here is your invite to the match. If you do not recieve the invite, use !invite to get a new one."
		);
		this.lobby.invitePlayer(user.ircUsername);
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
	 * @param {import("bancho.js").BanchoMessage} msg
	 */
	async rollListener(msg) {
		if (this.state != 5) return;
		if (msg.user.ircUsername != "BanchoBot") return;

		let content = msg.content;
		let roll = content.match(/(?<user>\w+) rolls (?<roll>\d+) point\(s\)/);
		if (roll) {
			let teamInMatch = await prisma.teamInMatch.findFirst({
				where: {
					team: {
						members: {
							some: {
								user: {
									osu_username: roll.groups.user,
								},
							},
						},
					},
				},
			});
			if (!teamInMatch.roll) {
				await prisma.teamInMatch.update({
					where: {
						team_id_match_id: {
							team_id: teamInMatch.team_id,
							match_id: this.id,
						},
					},
					data: {
						roll: parseInt(roll.groups.roll),
					},
				});
				let team = await prisma.team.findFirst({
					where: {
						id: teamInMatch.team_id,
					},
				});

				await this.channel.sendMessage(
					`${team.name} rolled a ${roll.groups.roll}`
				);
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
		if (this.state != 6) return;
		let command = msg.content.match(/!choose (?<order>\w+) (?<type>\w+)/);
		console.log(command);
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

		console.log(`Match ${this.id} state updated to ${states[state]}`);
	}

	async msgHandler(msg) {
		if (msg.self) return;
		console.log(
			`[${msg.channel.name}] ${msg.user.ircUsername} >> ${msg.message}`
		);

		if (this.state == 5) {
			this.rollListener(msg);
			return;
		}

		/*
		 *	Command Handling
		 */
		let stateCommands = {
			6: ["choose"],
		};
		let commandRegex = /^!\w+/g;
		/**
		 * @type {string}
		 */
		let message = msg.message;

		if (message.match(commandRegex)) {
			message = message.substring(1);
			let args = message.split(" ");
			let command = args[0];

			if (command == "!mp") return;
			if (!command) return;
			let options = args.splice(1, 1);
			try {
			} catch (e) {
				console.log(e);
				msg.user.sendMessage("We encountered an error: " + e);
			}
		}
	}

	/**
	 * Updates the log message
	 * @function
	 * @private
	 */
	async updateMessage() {
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
			.setFooter({ text: "Current phase: " + states[this.state] });

		if (this.state <= 2 || (this.state >= 5 && this.state <= 7)) {
			description += `
				**Score:**
				:red_square: ${this.teams[0].name} | ${this.teams[0].score} - ${this.teams[1].score} | ${this.teams[1].name} :blue_square:\n`;
		}

		if (this.state >= 5 && this.state <= 7) {
			let teamsInMatch = await prisma.teamInMatch.findMany({
				where: {
					match_id: this.id,
				},
			});
			description += "\n";

			for (const teamInMatch of teamsInMatch) {
				if (!teamInMatch.roll) return;
				let team = await prisma.team.findFirst({
					where: {
						id: teamInMatch.team_id,
					},
				});

				description += `**${team.name}** rolled a **${teamInMatch.roll}**\n`;
			}
		}
		if (this.state >= 0 || this.state <= 2) {
			embed.setImage(
				`https://assets.ppy.sh/beatmaps/${this.beatmap?.setId}/covers/cover.jpg`
			);
		}

		if (this.state == 3) {
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

		if (this.state == 4) {
			if (this.beatmap == null) {
				let host = this.lobby.getHost();
				embed.setDescription(
					`${host.user.username} is picking a warmup`
				);
				embed.setThumbnail(`https://s.ppy.sh/a/${host.user.id}`);
			} else {
				embed.setDescription(
					`**Warmup:** ${this.beatmap.artist} -  ${this.beatmap.title} [${this.beatmap.version}]`
				);
				embed.setImage(
					`https://assets.ppy.sh/beatmaps/${this.beatmap.setId}/covers/cover.jpg`
				);
			}
		}

		if (!(description == "")) {
			embed.setDescription(description);
		}
		await message.edit({ embeds: [embed] });
	}
}

module.exports.MatchManager = MatchManager;
