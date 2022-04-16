//@ts-check
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Pings the bot to check if it's online"),
	async execute(interaction) {
		let embed = new MessageEmbed()
			.setColor("#F88000")
			.setDescription("🏓 Pong!");
		await interaction.reply({ embeds: [embed] });
	},
	ephemeral: false,
	defer: false,
};
