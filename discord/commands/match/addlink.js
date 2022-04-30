const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { prisma } = require("../../../prisma");
const { MessageEmbed } = require("discord.js");
const { MatchManager } = require("../../../bancho/MatchManager");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("addlink")
		.setDescription("Quick test of message editing")
		.addStringOption((option) =>
			option
				.setName("link")
				.setDescription("The link to the lobby")
				.setRequired(true)
		),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let matchId = await prisma.match.findFirst({
			where: {
				teams: {
					some: {
						team: {
							members: {
								some: {
									discord_id: interaction.user.id,
								},
							},
						},
					},
				},
			},
		});
		matchId = matchId.id;

		let match = new MatchManager(
			matchId,
			interaction.options.getString("link")
		);
		try {
			match.createMatch();
		} catch (e) {
			console.log(e);
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: We encountered an error while joining the match"
				)
				.setColor("RED")
				.setFooter({
					text: "Make sure the lobby exists, and that you added the bot as a ref",
				});
			await interaction.editReply({ embeds: [embed] });
		}
	},
};
