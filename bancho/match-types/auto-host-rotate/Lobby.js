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
		this.lastMap = this.lobby.beatmap;

		this.channel.on("message", async (msg) => {
			await msgHandler(msg);
		});
		this.lobby.on("playerJoined", async (player) => {
			await joinHandler(player);
		});
		this.lobby.on("playerLeft", async (player) => {
			await leaveHandler(player);
		});
		this.lobby.on("beatmap", async (beatmap) => {
			console.log(this.lobby.beatmap);
			await mapHandler(this.lastMap, beatmap);
		});
		// Make lobby name
		let nameString = "AHR |";
		if (this.min_rank != null || !his.max_rank != 1) {
			nameString += ` (#${
				this.min_rank.toLocaleString() ?? "∞"
			} - #${this.max_rank.toLocaleString()})`;
		}
		if (this.min_stars != 0 || this.max_stars != null) {
			nameString += ` (${this.min_stars.toFixed(2)}☆ - ${
				this.max_stars.toFixed(2) + "☆" ?? "∞"
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
			}
		}

		// Add players to queue
		let slots = this.lobby.slots.filter((x) => x);
		for (const player of slots) {
			if (!playerMap.includes(player.user.id)) {
				await this.addPlayer(player);
			}
		}
	}

	/**
	 *
	 * @param {import("bancho.js").BanchoLobbyPlayer} user
	 */
	async addPlayer(user) {
		let player = new Player(user, this);
		await player.toDB();
		this.queue.push(player);
	}
}

/**
 *
 * @param {import("bancho.js").BanchoMessage} msg
 */
async function msgHandler(msg) {
	if (msg.self) return;
	console.log(
		`[${msg.channel.name}] ${msg.user.ircUsername} >> ${msg.message}`
	);
}

/**
 *
 * @param {import("bancho.js").BanchoLobbyPlayer} player
 */
async function joinHandler(player) {
	console.log(player);
}

/**
 *
 * @param {import("bancho.js").BanchoLobbyPlayer} player
 */
async function leaveHandler(player) {}

function secondsToTime(seconds) {
	let minutes = Math.floor(seconds / 60);
	seconds = Math.floor((seconds % 60) % 60);
	return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

module.exports.Lobby = Lobby;
