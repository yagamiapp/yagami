const { SlashCommandSubcommandBuilder } = require("discord.js");
let { data: modal } = require("../../modals/scrimCreate.js");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create a scrim match between any number of players"),
  /**
   * @param interaction {import("discord.js").CommandInteraction}
   */
	async execute(interaction) {
    await interaction.showModal(modal);
	},
};
