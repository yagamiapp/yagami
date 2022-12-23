const { SlashCommandBuilder } = require("discord.js");

const inviteURL = "https://discord.com/oauth2/authorize?client_id=956030276050493441&permissions=10603482224&scope=bot%20applications.commands"
module.exports = {
	data: new SlashCommandBuilder()
		.setName("invite")
		.setDescription("Generate an invite to the server"),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply();

		let link = inviteURL;
		await interaction.editReply({ content: link });
	},
};
