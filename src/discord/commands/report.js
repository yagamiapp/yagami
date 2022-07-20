const modal = require("../modals/report");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("report")
		.setDescription("Report a bug"),
	async execute(interaction) {
		interaction.showModal(modal.data);
	},
};
