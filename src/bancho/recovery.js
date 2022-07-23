const { prisma } = require("../prisma");
const { MatchManager } = require("./match-types/bracket/Match");
const { bot } = require("../discord");
const { EmbedBuilder } = require("discord.js");
module.exports.recover = async () => {
	let matches = await prisma.match.findMany({});

	for (const match of matches) {
		if (match.state < 8 && match.state != -1) {
			let manager = new MatchManager(match.id, match.mp_link);
			await manager.createMatch();
		} else if (match.state == -1) {
			let channel = await bot.channels.fetch(match.channel_id);
			let message = await channel.messages.fetch(match.message_id);

			let round = await prisma.round.findUnique({
				where: {
					id: match.roundId,
				},
			});

			let teams = await prisma.team.findMany({
				where: {
					InBracketMatches: {
						some: {
							matchId: match.id,
						},
					},
				},
			});

			let finalEmbed = EmbedBuilder.from(message.embeds[0]);
			finalEmbed
				.setTitle(
					`DELETED: ${round.acronym}: (${teams[0].name}) vs (${teams[1].name})`
				)
				.setColor("#555555")
				.setFooter({ text: "Match Deleted" })
				.setTimestamp();

			await prisma.match.delete({
				where: {
					id: match.id,
				},
			});

			await message.edit({ embeds: [finalEmbed], components: [] });
		}
	}
};
