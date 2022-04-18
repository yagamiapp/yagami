let { MessageEmbed } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const firebase = require("../../../firebase");
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
		let options = interaction.options.data[0].options;

		let active_tournament = await firebase.getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);

		// Replace data at acronym
		let toggle = interaction.options.getBoolean("enabled");
		firebase.setData(
			toggle,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament,
			"allow_registration"
		);

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
