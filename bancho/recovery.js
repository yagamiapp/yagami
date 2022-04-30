const { prisma } = require("../prisma");
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
			let manager = new Match(match.id, match.mp_link);
			await manager.init();
		}
	}
};
