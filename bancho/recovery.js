const { prisma } = require("../prisma");
const { MatchManager } = require("./MatchManager");
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

	for (const match of matches) {
		if (match.state < 8 && match.state != 3) {
			let manager = new MatchManager(match.id, match.mp_link);
			await manager.createMatch();
		}
	}
};
