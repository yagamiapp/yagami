//@ts-check
const { MessageEmbed } = require("discord.js");

module.exports = {
	async execute(interaction) {
		let embed = new MessageEmbed()
			.setColor("#F88000")
			.setDescription("🏓 Pong!");
		await interaction.editReply({ embeds: [embed] });
	},
};
