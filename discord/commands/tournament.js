const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, Permissions, MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("tournament")
		.setDescription("Configuring agent for your tournament!")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("create")
				.setDescription("Create a new tournament")
				.addStringOption((option) =>
					option
						.setName("acronym")
						.setDescription("The acronym for the tournament")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("list")
				.setDescription("Lists all tournaments in this guild")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("edit")
				.setDescription("Edits the currently selected tournament")
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
			let file = require("./tournament/" + subcommand + ".js");
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
