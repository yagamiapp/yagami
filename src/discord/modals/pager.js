const {
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	EmbedBuilder,
	Colors,
} = require("discord.js");

module.exports = {
	data: new ModalBuilder()
		.setCustomId("pager")
		.setTitle("Pager")
		.setComponents([
			new ActionRowBuilder().addComponents([
				new TextInputBuilder()
					.setLabel("Enter the page to go to")
					.setCustomId("page")
					.setRequired(true)
					.setStyle(TextInputStyle.Short),
			]),
		]),
	/**
	 *
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 * @param {object} command
	 */
	async execute(interaction, command) {
		let { min, max, list } = command.options;

		let index = interaction.fields.getTextInputValue("page");
		let numRegex = /^\d+$/g;
		if (!index.match(numRegex)) return;
		index = parseInt(index);

		if (parseInt(min) > index) return;
		if (parseInt(max) < index) return;

		index = index - 1;

		let listCommand = interaction.client.buttons.get(list);
		await listCommand.execute(interaction, { options: { index } });
	},
};
