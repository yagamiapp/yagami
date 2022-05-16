const { prisma } = require("../prisma");
const { MatchManager } = require("./match-types/MatchManager");
const { Lobby } = require("./match-types/auto-host-rotate/Lobby");

module.exports.recover = async () => {
	let matches = await prisma.match.findMany({
		where: {
			OR: [
				{
					state: {
						gte: 8,
					},
				},
				{
					state: {
						not: 3,
					},
				},
			],
		},
	});
	let hostRotates = await prisma.autoHostRotate.findMany({});
	for (let lobby of hostRotates) {
		let ahr = new Lobby(lobby.discordId);
		try {
			await ahr.load();
		} catch (e) {
			console.log(e);
			if (e == "Could not join channel")
				await prisma.autoHostRotate.delete({
					where: {
						discordId: ahr.owner_id,
					},
				});
		}
	}

	for (const match of matches) {
		if (match.state < 8 && match.state != 3) {
			let manager = new MatchManager(match.id, match.mp_link);
			await manager.createMatch();
		}
	}
};
