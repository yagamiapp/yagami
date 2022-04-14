const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, Permissions, MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("settings")
		.setDescription("Manage the settings for your server")
		.addSubcommand((command) =>
			command
				.setName("view")
				.setDescription("View the settings for your server")
		),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		if (
			interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
		) {
			let subcommand = interaction.options.getSubcommand();
			let file = require("./settings/" + subcommand + ".js");
			await file.execute(interaction);
		} else {
			let embed = new MessageEmbed()
				.setDescription("Missing Permissions")
				.setColor("#FF6666");
			await interaction.editReply({
				embeds: [embed],
			});
		}
	},
	ephemeral: true,
	defer: true,
};
