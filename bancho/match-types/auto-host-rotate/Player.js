const { prisma } = require("../../../prisma");

class Player {
	/**
	 *
	 * @param {import("bancho.js").BanchoLobbyPlayer} player
	 * @param {import("./Lobby.js").Lobby} lobby
	 */
	constructor(player, lobby) {
		this.player = player;
		this.lobby = lobby;
	}

	async toDB() {
		await prisma.autoHostRotatePlayer.create({
			data: {
				id: this.player.user.id,
				username: this.player.user.username,
				rank: this.player.user.ppRank,
				lobbyId: this.lobby.owner_id,
			},
		});
	}

	async setHost() {
		this.host = true;
		await prisma.autoHostRotatePlayer.update({
			where: {
				id: this.player.user.id,
			},
			data: {
				HostIn: {
					connect: {
						discordId: this.lobby.owner_id,
					},
				},
			},
		});
	}
}

module.exports.Player = Player;
