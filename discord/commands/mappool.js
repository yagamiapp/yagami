const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction } = require("discord.js");
const options = {};

module.exports = {
	data: new SlashCommandBuilder()
		.setName("mappool")
		.setDescription("Lists maps in a given mappool")
		.addStringOption((option) => {
			option
				.setName("Mappool ID")
				.setDescription("Required to identify the pool")
				.setRequired(true);
		}),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.reply();
	},
};
