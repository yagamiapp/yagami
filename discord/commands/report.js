const modal = require("../modals/report");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("report")
		.setDescription("Report a bug"),
	async execute(interaction) {
		let data = modal.getData();
		interaction.showModal(data);
	},
};
