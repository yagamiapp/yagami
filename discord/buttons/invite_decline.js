const { MessageButton, ButtonInteraction, Message } = require("discord.js");

module.exports = {
	data: new MessageButton()
		.setCustomId("invite_decline")
		.setLabel("Decline")
		.setStyle("PRIMARY"),
	/**
	 *
	 * @param {ButtonInteraction} interaction
	 */
	async execute(interaction) {
		interaction.update("Declining invite...");
	},
};
