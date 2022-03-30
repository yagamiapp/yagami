let { CommandInteraction } = require("discord.js");
module.exports = {
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		console.log("Edit command deployed!");
		let options = interaction.options.data[0].options;

		options.forEach();
	},
};
