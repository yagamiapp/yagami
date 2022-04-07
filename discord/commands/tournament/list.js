let firebase = require("../../../firebase");
let { CommandInteraction, MessageEmbed } = require("discord.js");
let { stripIndents } = require("common-tags");

module.exports = {
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		let tournaments = await firebase.getData(
			"guilds",
			interaction.guildId,
			"tournaments"
		);

		if (tournaments == null) {
			let embed = new MessageEmbed()
				.setTitle("No Tournaments Found")
				.setColor("#FF4444");

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let active_tournament = tournaments[tournaments.active_tournament];

		let embed = new MessageEmbed()
			.setTitle("Tournaments in this server:")
			.setColor("#F88000")
			.addField(
				`**Active Tournament: \`${tournaments.active_tournament}\`**`,
				stripIndents`
				**Name:** ${active_tournament.rules.name}
				**Acronym:** ${tournaments.active_tournament}
				**Score Mode:** ${active_tournament.rules.score_mode}
				**Team Mode:** ${active_tournament.rules.team_mode}
				**Force NF:** ${active_tournament.rules.force_nf}
				`
			);

		let tourneyString = "";
		for (const key in tournaments) {
			if (key != tournaments.active_tournament && key != "active_tournament") {
				const element = tournaments[key];
				console.log(element);

				tourneyString += `**${key}:** ${element.rules?.name}\n`;
			}
		}

		embed.addField("Other Tournaments", tourneyString);

		await interaction.editReply({ embeds: [embed] });
	},
};
