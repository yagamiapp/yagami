const { SlashCommandBuilder } = require("discord.js");
const redirects = require("../../web/redirects.json");

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

		let link = redirects.find((x) => x.path === "/invite");
		await interaction.editReply({ content: link.dest });
	},
};
