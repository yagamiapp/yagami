const prismaClientBuilder = require("@prisma/client");
const prisma = new prismaClientBuilder.PrismaClient();
module.exports = {
	prisma,
	/**
	 * Fetches a guild from the database
	 * @param {number} id The id of a guild
	 * @returns {object}
	 */
	async fetchGuild(id) {
		let guild = await prisma.guild.findFirst({
			where: {
				guild_id: id,
			},
		});
		let tournaments = await prisma.tournament.findMany({
			where: {
				Guild_id: id,
			},
		});
		guild.tournaments = tournaments;
		tournaments.forEach((tournament) => {
			if (tournament.id == guild.active_tournament)
				guild.active_tournament = tournament;
		});
		return guild;
	},
};
