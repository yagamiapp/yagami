let { MessageEmbed } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const firebase = require("../../../firebase");
const { fetchGuild, prisma } = require("../../../prisma");
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
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		// Replace data at acronym
		let toggle = interaction.options.getBoolean("enabled");
		await prisma.tournament.update({
			where: { id: tournament.id },
			data: { allow_registrations: toggle },
		});

		let embed = new MessageEmbed()
			.setTitle("Successfully changed settings!")
			.setColor("GREEN")
			.setDescription(
				stripIndents`
                Set registration status to ${toggle}
				`
			);

		await interaction.editReply({ embeds: [embed] });
	},
};
