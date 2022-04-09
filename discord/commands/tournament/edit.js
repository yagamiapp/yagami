let { CommandInteraction } = require("discord.js");
const firebase = require("../../../firebase");
const { deployCommands } = require("../../deploy-commands");
const linkCommand = require("./list");
module.exports = {
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		let options = interaction.options.data[0].options;

		let active_tournament = await firebase.getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);
		let tournament = await firebase.getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		let acronym = active_tournament;
		options.forEach((element) => {
			let prop = element.name;
			if (prop == "acronym") {
				acronym = element.value.toUpperCase();
			} else {
				tournament.rules[prop] = element.value;
			}
		});

		// Clear data in database
		firebase.setData(
			{},
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		// Replace data at acronym
		firebase.setData(
			tournament,
			"guilds",
			interaction.guildId,
			"tournaments",
			acronym
		);

		// Change active tournament to acronym
		firebase.setData(
			acronym,
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);

		linkCommand.execute(interaction);

		deployCommands(interaction.guildId);
	},
};
