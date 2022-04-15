const { MessageButton, ButtonInteraction, Message } = require("discord.js");

module.exports = {
	data: new MessageButton()
		.setCustomId("invite_accept")
		.setLabel("Accept")
		.setStyle("PRIMARY"),
	/**
	 *
	 * @param {ButtonInteraction} interaction
	 */
	async execute(interaction) {
		interaction.update("Accepting invite...");
	},
};
