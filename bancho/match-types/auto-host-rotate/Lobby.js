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

		this.channel.on("message", async (msg) => {
			await msgHandler(msg);
		});
		this.lobby.on("playerJoined", async (player) => {
			await joinHandler(player);
		});
		this.lobby.on("playerLeft", async (player) => {
			await leaveHandler(player);
		});

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
		console.log("Player Map", playerMap);
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

		console.log(this.queue);
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

module.exports.Lobby = Lobby;
