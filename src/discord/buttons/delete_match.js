const { MessageButton, EmbedBuilder, Colors } = require("discord.js");
const { prisma, fetchGuild } = require("../../prisma");

module.exports = {
	data: { customId: "delete_match" },
	/**
	 *
	 * @param {import("discord.js").ButtonInteraction} interaction
	 * @param {object} command
	 * @returns
	 */
	async execute(interaction, command) {
		if (!interaction.memberPermissions.has("ADMINISTRATOR")) {
			let embed =
				new EmbedBuilder().setDescription(
					"**Err:** You lack the permissions to perform this action"
				) /
				setColor(Colors.Red).setFooter({
					text: "Please ping an admin to delete the match for you",
				});

			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
			return;
		}
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		let round = await prisma.round.findFirst({
			where: {
				Match: {
					some: {
						id: parseInt(command.options.id),
					},
				},
				tournamentId: tournament.id,
			},
		});
		// Get the teams in the match
		let teams = await prisma.team.findMany({
			where: {
				InBracketMatches: {
					some: {
						matchId: parseInt(command.options.id),
					},
				},
			},
		});

		await prisma.match.delete({
			where: {
				id: parseInt(command.options.id),
			},
		});

		let finalEmbed = interaction.message.embeds[0];
		finalEmbed
			.setTitle(
				`DELETED: ${round.acronym}: (${teams[0].name}) vs (${teams[1].name})`
			)
			.setColor("#555555")
			.setDescription("")
			.setFooter({ text: "Match Deleted" })
			.setTimestamp();
		await interaction.update({
			content: null,
			embeds: [finalEmbed],
			components: [],
		});
	},
};
