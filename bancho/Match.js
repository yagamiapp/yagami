const { prisma } = require("../prisma");
const { fetchChannel } = require("./index");
const { bot: discord } = require("../discord");
const { MessageEmbed } = require("discord.js");
const { Team } = require("./Team");
const { msgHandler } = require("./msgHandler");

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

class Match {
	/**
	 *
	 * @constructor
	 * @param {number} id ID of the match
	 * @param {string} mp The link to the match
	 */
	constructor(id, mp) {
		this.id = id;
		this.channel = fetchChannel(mp);
		this.lobby = this.channel.lobby;
	}

	async init() {
		let match = await prisma.match.findFirst({
			where: {
				id: this.id,
			},
		});

		this.message_id = match.message_id;
		this.channel_id = match.channel_id;
		this.state = match.state;
		this.waiting_on = match.waiting_on;

		await this.channel.join();
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
		// Setup lobby
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

		// Setup event handlers
		this.channel.on("message", (msg) => msgHandler(msg));
		this.channel.lobby.on("playerJoined", (event) => {
			this.joinHandler(event);
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
			let userTest = teamTest.getUserPos(event.player.user.id);
			if (userTest) {
				user = teamTest.getUser(userTest);
				team = teamTest;
				team.addPlayer(event.player);
			}
		}
		if (!user) {
			this.channel.lobby.kick(event.player.user.username);
		}
	}

	async finishHandler() {}

	async beatmapHandler(beatmap) {
		this.beatmap = beatmap;
		this.updateMessage();
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

	async warmup() {
		console.log("Warming Up");
	}

	async recover() {
		if (this.state == 4) {
			this.warmup();
		}
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
			.setThumbnail(oldembed.thumbnail?.url);

		if (this.state >= 0 || this.state <= 2 || this.state == 4) {
			embed.setImage(
				`https://assets.ppy.sh/beatmaps/${this.beatmap?.setId}/covers/cover.jpg`
			);
		}

		await message.edit({ embeds: [embed] });
	}
}

module.exports.Match = Match;
