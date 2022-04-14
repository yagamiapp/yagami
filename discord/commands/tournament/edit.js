let { CommandInteraction, MessageEmbed } = require("discord.js");
const firebase = require("../../../firebase");
let { stripIndents } = require("common-tags");
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

		let embed = new MessageEmbed()
			.setTitle("Successfully changed settings!")
			.setColor("GREEN")
			.setDescription(
				stripIndents`
				**Name:** ${tournament.rules.name}
				**Acronym:** ${active_tournament}
				**Score Mode:** ${tournament.rules.score_mode}
				**Team Mode:** ${tournament.rules.team_mode}
				**Team Size:** ${tournament.rules.team_size}
				**Force NF:** ${tournament.rules.force_nf}
				`
			);

		await interaction.editReply({ embeds: [embed] });
	},
};
