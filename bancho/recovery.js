const { prisma } = require("../prisma");
const { MatchManager } = require("./match-types/bracket/Match");
module.exports.recover = async () => {
	let matches = await prisma.match.findMany({});

	for (const match of matches) {
		if (match.state < 8 && match.state != -1) {
			let manager = new MatchManager(match.id, match.mp_link);
			await manager.createMatch();
		} else if (match.state == -1) {
			//TODO: Delete match
		}
	}
};
