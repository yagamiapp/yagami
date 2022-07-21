let { EmbedBuilder, Colors } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("discord.js");
const { fetchGuild, prisma } = require("../../../../prisma");
let { stripIndents } = require("common-tags");
module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("registration")
		.setDescription(
			"Toggles the ability for users to register to the tournament"
		)
		.addBooleanOption((option) =>
			option
				.setName("enabled")
				.setDescription("Whether registrations are allowed or not")
				.setRequired(true)
		),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		if (!tournament) {
			let embed = new EmbedBuilder()
				.setDescription(`**Err**: No active tournament found.`)
				.setColor(Colors.Red)
				.setFooter({
					text: "You can set an active tournament with !tournament activate",
				});
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		// Replace data at acronym
		let toggle = interaction.options.getBoolean("enabled");
		await prisma.tournament.update({
			where: { id: tournament.id },
			data: { allow_registrations: toggle },
		});

		let embed = new EmbedBuilder()
			.setTitle("Successfully changed settings!")
			.setColor(Colors.Green)
			.setDescription(
				stripIndents`
                Set registration status to ${toggle}
				`
			);

		await interaction.editReply({ embeds: [embed] });
	},
};
