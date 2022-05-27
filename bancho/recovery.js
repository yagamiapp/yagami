const { prisma } = require("../prisma");
const { MatchManager } = require("./match-types/bracket/Match");
module.exports.recover = async () => {
	let matches = await prisma.match.findMany({
		where: {
			state: {
				not: -1,
			},
		},
	});
	console.log(matches);

	for (const match of matches) {
		if (match.state < 8) {
			let manager = new MatchManager(match.id, match.mp_link);
			await manager.createMatch();
		}
	}
};
