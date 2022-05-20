const { prisma } = require("../../../prisma");
const client = require("../../client");
const { Player } = require("./Player");

class Lobby {
	/**
	 *
	 * @param {string} id The discord id of the user who created the lobby
	 */
	constructor(id) {
		this.owner_id = id;
	}

	async load() {
		// Set up lobby & listeners
		let lobby = await prisma.autoHostRotate.findUnique({
			where: {
				discordId: this.owner_id,
			},
		});
		this.max_length = lobby.max_length;
		this.max_rank = lobby.max_rank;
		this.max_stars = lobby.max_stars;
		this.min_length = lobby.min_length;
		this.min_rank = lobby.min_rank;
		this.min_stars = lobby.min_stars;

		if (!lobby) {
			throw "User does not own a lobby";
		}

		this.channel = client.fetchChannel(lobby.mp_link);
		/**
		 * @type {import("bancho.js").BanchoLobby}
		 */
		this.lobby = this.channel.lobby;
		try {
			await this.channel.join();
		} catch (e) {
			throw "Could not join channel";
		}
		await this.lobby.clearHost();
		await this.lobby.updateSettings();
		/**
		 * @type {import("nodesu").Beatmap}
		 */
		this.lastMap = this.lobby.beatmap;

		this.channel.on("message", async (msg) => {
			await this.msgHandler(msg);
		});
		this.lobby.on(
			"playerJoined",
			async (player) => await this.joinHandler(player)
		);
		this.lobby.on(
			"playerLeft",
			async (player) => await this.leaveHandler(player)
		);
		this.lobby.on(
			"beatmap",
			async (beatmap) => await this.mapHandler(this.lastMap, beatmap)
		);
		this.lobby.on("matchFinished", async () => await this.rotateHost());
		this.lobby.on("allPlayersReady", async () => await this.readyHandler());

		// Make lobby name
		let nameString = "AHR |";
		if (this.min_rank != null || this.max_rank != 1) {
			nameString += ` (#${
				this.min_rank.toLocaleString() ?? "∞"
			} - #${this.max_rank.toLocaleString()})`;
		}
		if (this.min_stars != 0 || this.max_stars != null) {
			nameString += ` (${this.min_stars.toFixed(2)}☆ - ${
				this.max_stars?.toFixed(2) + "☆" ?? "∞"
			})`;
		}
		if (this.min_length != 0 || this.max_length != null) {
			nameString += ` (${secondsToTime(this.min_length)} - ${
				secondsToTime(this.max_length) ?? "∞"
			})`;
		}

		this.channel.sendMessage(`!mp name ${nameString}`);

		/**
		 * Set up player queue
		 * @type {Player[]}
		 */
		this.queue = [];

		let dbQueue = await prisma.autoHostRotatePlayer.findMany({
			where: {
				lobbyId: this.owner_id,
			},
		});

		// If player  in queue is not in lobby, remove them
		let playerMap = dbQueue.map((user) => user.id);
		let slotMap = this.lobby.slots
			.filter((x) => x)
			.map((slot) => slot.user.id);
		for (const player of playerMap) {
			if (!slotMap.includes(player)) {
				await prisma.autoHostRotatePlayer.delete({
					where: {
						id: player,
					},
				});
				continue;
			}
			let user = this.lobby.slots.find((x) => x.user.id == player);
			await this.addPlayer(user);
		}

		// Add players to queue
		let slots = this.lobby.slots.filter((x) => x);
		for (const player of slots) {
			await this.joinHandler(player);
		}

		await this.rotateHost();
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoLobbyPlayer} user
	 * @private
	 */
	async addPlayer(user) {
		let player = new Player(user, this);
		await player.toDB();
		this.queue.push(player);
	}

	/**
	 *
	 * @param {Player} user
	 * @private
	 */
	async removePlayer(user) {
		let splice = this.queue.indexOf(user);
		await prisma.autoHostRotatePlayer.delete({
			where: {
				id: user.player.user.id,
			},
		});
		this.queue.splice(splice, 1);
	}

	async mapHandler() {
		const map = this.lobby.beatmap;

		if (map == null) return;
		if (this.lastMap.beatmapId == map.beatmapId) return;

		if (map.difficultyRating > this.max_stars && this.max_stars != null) {
			this.lobby.setMap(this.lastMap);
			this.channel.sendMessage(
				`${map.artist} - ${map.title} [${
					map.version
				}]: ${map.stars.toFixed(2)}☆ > ${this.max_stars.toFixed(
					2
				)}☆ Please pick another map`
			);
			return;
		}

		if (map.difficultyRating < this.min_stars && this.min_stars != null) {
			this.lobby.setMap(this.lastMap);
			this.channel.sendMessage(
				`${map.artist} - ${map.title} [${
					map.version
				}]: ${map.stars.toFixed(2)}☆ < ${this.min_stars.toFixed(
					2
				)}☆ Please pick another map`
			);
			return;
		}

		if (map.hitLength > this.max_length && this.max_length != null) {
			this.lobby.setMap(this.lastMap);
			this.channel.sendMessage(
				`${map.artist} - ${map.title} [${map.version}]: ${secondsToTime(
					map.hitLength
				)} < ${secondsToTime(this.max_length)} Please pick another map`
			);
			return;
		}

		if (map.hitLength < this.min_length && this.min_length != null) {
			this.lobby.setMap(this.lastMap);
			this.channel.sendMessage(
				`${map.artist} - ${map.title} [${map.version}]: ${secondsToTime(
					map.hitLength
				)} < ${secondsToTime(this.min_length)} Please pick another map`
			);
			return;
		}

		this.channel.sendMessage(
			`[https://osu.ppy.sh/b/${map.beatmapId} ${map.artist} - ${map.title} [${map.version}]] - [https://beatconnect.io/b/${map.beatmapSetId} Beatconnect Mirror]`
		);
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoMessage} msg
	 * @private
	 */
	async msgHandler(msg) {
		if (msg.self) return;
		console.log(
			`[${msg.channel.name}] ${msg.user.ircUsername} >> ${msg.message}`
		);

		if (
			msg.message == "Closed the match" &&
			msg.user.ircUsername == "BanchoBot"
		) {
			this.closeLobby();
			return;
		}
		console.log(msg.message);
		let command = msg.message.match(/^!\S+/);
		if (!command || msg.content.startsWith("!mp")) return;
		let args = msg.message.replace("!", "").split(" ");
		console.log(args);

		if (args[0] == "skip") {
			this.rotateHost();
			return;
		}

		if (args[0] == "queue") {
			this.sendQueueMessage();
		}
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoLobbyPlayer} player
	 * @private
	 */
	async joinHandler(player) {
		if (player.user.ppRank < this.max_rank && this.max_rank != null) {
			this.lobby.kickPlayer(player.user.username);
			player.user.sendMessage(`Your rank is too high for this lobby`);
		}
		if (this.min_rank != null && player.user.ppRank > this.min_rank) {
			this.lobby.kickPlayer(player.user.username);
			player.user.sendMessage(`Your rank is too low for this lobby`);
		}
		let playerMap = this.queue.map((user) => user.player.user.id);
		if (!playerMap.includes(player.user.id)) {
			await this.addPlayer(player);
		}
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoLobbyPlayer} player
	 * @private
	 */
	async leaveHandler(player) {
		let playerCount = this.lobby.slots.filter((x) => x).length;
		if (playerCount == 0) this.closeLobby();
		let obj = this.queue.find((x) => x.player.user.id == player.user.id);
		this.removePlayer(obj);
	}

	/**
	 * On lobby finish, or when first initialized.
	 */
	async rotateHost() {
		this.lobby.updateSettings();
		// Add last host to bottom of queue if there is one
		if (this.currentHost != null) {
			this.queue[this.queue.length] = this.currentHost;
		}
		// Get top player of queue
		let top = this.queue[0];
		// Remove top player from queue
		this.queue.splice(0, 1);

		await this.setCurrentHost(top);
		await this.channel.sendMessage(
			`${top.player.user.ircUsername}, you are now the host, use !skip to skip host`
		);
		await this.sendQueueMessage();
	}

	/**
	 * @param {Player} player
	 */
	async setCurrentHost(player) {
		this.currentHost = player;
		await this.lobby.setHost("#" + player.player.user.id);
		await player.setHost();
	}

	async readyHandler() {
		await this.lobby.startMatch();
	}

	async sendQueueMessage() {
		let queueMessage = this.queue
			.map((x) => x.player.user.ircUsername)
			.join(", ");
		queueMessage =
			queueMessage.length > 100
				? queueMessage.slice(0, 100) + "..."
				: queueMessage;
		await this.channel.sendMessage(`Current Queue: ${queueMessage}`);
	}

	async closeLobby() {
		console.log("Closing rotate lobby " + this.channel.name);
		await prisma.autoHostRotate.delete({
			where: {
				discordId: this.owner_id,
			},
		});
	}
}

function secondsToTime(seconds) {
	let minutes = Math.floor(seconds / 60);
	seconds = Math.floor((seconds % 60) % 60);
	return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

module.exports.Lobby = Lobby;
