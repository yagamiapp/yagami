const modal = require("../modals/report");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("report")
		.setDescription("Report a bug"),
	async execute(interaction) {
		interaction.showModal(modal.data);
	},
};
