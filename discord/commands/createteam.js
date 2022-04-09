const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, Permissions, MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("createteam")
		.setDescription("Creates a team for the tournament"),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		interaction.reply("Creating team...");
	},
	ephemeral: true,
	defer: true,
	dontPushByDefault: true,
};
