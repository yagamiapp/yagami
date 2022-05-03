const { prisma } = require("../prisma");
const { bot: discord } = require("../discord");
const { MessageEmbed } = require("discord.js");
const { Team } = require("./Team");
const { msgHandler } = require("./msgHandler");
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
		module.exports[`match_${id}`] = this;
	}

	async createMatch() {
		this.channel = fetchChannel(this.mp);
		/**
		 * @type {import("bancho.js").BanchoLobby}
		 */
		this.lobby = this.channel.lobby;
		try {
			await this.channel.join();
		} catch (e) {
			console.log(`${this.mp} no longer exists`);
			await prisma.match.update({
				where: {
					id: this.id,
				},
				data: {
					mp_link: null,
				},
			});
		}
		await this.lobby.clearHost();

		// Get match from DB and assign values
		let match = await prisma.match.findFirst({
			where: {
				id: this.id,
			},
		});
		this.message_id = match.message_id;
		this.channel_id = match.channel_id;
		this.state = match.state;
		this.waiting_on = match.waiting_on || 0;
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

		// Setup lobby
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

		await this.lobby.setSettings(
			this.tournament.team_mode,
			this.tournament.score_mode,
			this.tournament.XvX_mode * 2 + 1
		);
		this.channel.sendMessage("Successfully Joined Channel!");

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
			this.teams.push(new Team(team, users));
		}

		// Do onJoin for players currently in the lobby
		let players = this.lobby.slots;
		for (let player of players) {
			if (!player) continue;
			this.joinHandler({ player });
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
		this.channel.on("message", (msg) => msgHandler(msg));
		this.lobby.on("playerJoined", (event) => {
			this.joinHandler(event);
		});
		this.lobby.on("allPlayersReady", () => {
			this.readyHandler();
		});
		this.lobby.on("matchFinished", async () => await this.finishHandler());
		this.lobby.on(
			"beatmap",
			async (beatmap) => await this.beatmapHandler(beatmap)
		);
		// Start Warmups
		if (this.state == 3) {
			this.updateState(4);
			this.warmup();
			return;
		}

		this.recover();
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
			this.channel.lobby.kickPlayer(event.player.user.username);
			return;
		}

		if (team == this.teams[0]) {
			console.log("Team 0");
		}
		if (team == this.teams[1]) {
			console.log("Team 1");
		}
	}

	async readyHandler() {
		if (this.state == 4) {
			this.channel.sendMessage("All players ready!");
			this.lobby.startMatch(5);
		}
	}

	async finishHandler() {
		if (this.state == 4) {
			if (this.waiting_on == 0) {
				this.updateWaitingOn(1);
				this.warmup();
			}
			if (this.waiting_on == 1) {
				this.updateState(5);
				this.roll();
			}
		}
	}

	async beatmapHandler(beatmap) {
		this.beatmap = beatmap;
		this.updateMessage();
		if (this.state == 4) {
			if (beatmap != null) {
				await this.lobby.clearHost();
			}
		}
	}

	async warmup() {
		let hosts = this.teams[this.waiting_on].players;
		let slots = this.lobby.slots;
	}

	async recover() {
		if (this.state == 4) {
			this.warmup();
		}
	}

	async invitePlayer(name) {
		let user = await fetchUser(name);
		user.sendMessage(
			"Here is your invite to the match. If you do not recieve the invite, use !invite to get a new one."
		);
		this.lobby.invitePlayer(user.ircUsername);
	}
	/**
	 * Moves a player to a different slot, or swaps their position with the player in that slot
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

	/**
	 * Updates the log message
	 * @function
	 * @private
	 */
	async updateMessage() {
		while (!this.channel_id) {
			await new Promise((resolve) => setTimeout(resolve, 250));
		}
		let channel = await discord.channels.fetch(this.channel_id);
		/**
		 * @type {import("discord.js").Message}
		 */
		let message = await channel.messages.fetch(this.message_id);
		let oldembed = message.embeds[0];
		let embed = new MessageEmbed()
			.setTitle(oldembed.title)
			.setColor(oldembed.color)
			.setAuthor(oldembed.author)
			.setThumbnail(oldembed.thumbnail?.url)
			.setURL(this.mp)
			.setFooter({ text: "Current phase: " + states[this.state] });

		if (this.state >= 0 || this.state <= 2) {
			embed.setImage(
				`https://assets.ppy.sh/beatmaps/${this.beatmap?.setId}/covers/cover.jpg`
			);
		}

		if (this.state == 4) {
			if (this.beatmap == null) {
				let host = this.lobby.getHost();
				embed.setDescription(`${host.user.username} is picking a warmup`);
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

		await message.edit({ embeds: [embed] });
	}
}

module.exports.MatchManager = MatchManager;
