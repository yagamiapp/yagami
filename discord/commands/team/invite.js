//@ts-check
const { CommandInteraction, MessageEmbed } = require("discord.js");

module.exports = {
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		let user = interaction.options.getUser("user");
		let dm = await user.createDM();
		dm.send("Hi!");
	},
};
