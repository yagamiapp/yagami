const { MessageButton, MessageEmbed } = require("discord.js");
const { execute } = require("../commands/link");

module.exports = {
	data: new MessageButton()
		.setCustomId("link")
		.setLabel("Link Account")
		.setStyle("PRIMARY"),
	async execute(interaction, command) {
		await execute(interaction);
	},
};
