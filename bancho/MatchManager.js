const { Match } = require("./Match");
const { prisma } = require("../prisma");

class MatchManager {
	/**
	 * Creates a new match to manage
	 * @function
	 * @public
	 * @param {number} id Match ID from the database
	 * @param {string} mp The MP Link
	 */
	createMatch(id, mp) {
		let match = new Match(id, mp);
		match.init();
	}
	/**
	 * Recovers in-progress matches on restart
	 * @function
	 * @public
	 */
	async recoverMatches() {
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
				this.createMatch(match.id, match.mp_link);
			}
		}
	}
}
