const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { deployCommands } = require("../deploy-commands");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("updatecommands")
		.setDescription("Updates guild permissions and commands"),
	async execute(interaction) {
		await interaction.deferReply();
		await deployCommands(interaction.guild);

		let embed = new MessageEmbed()
			.setColor("#BBBBBB")
			.setDescription("Updated guild commands and permissions");
		await interaction.editReply({ embeds: [embed] });
	},
	ephemeral: false,
	defer: false,
};
