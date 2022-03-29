//@ts-check
const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("tourney")
		.setDescription("Configuring agent for your tournament!")
		.addSubcommand((subcommand) =>
			subcommand.setName("create").setDescription("Create a new tournament")
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
		await interaction.editReply("Pong!");
	},
	ephemeral: true,
};
