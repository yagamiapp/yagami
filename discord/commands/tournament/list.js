let firebase = require("../../../firebase");
let { CommandInteraction, MessageEmbed } = require("discord.js");
let { stripIndent } = require("common-tags");

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

		console.log(tournaments);

		if (tournaments == null) {
			let embed = new MessageEmbed()
				.setTitle("No Tournaments Found")
				.setColor("#FF4444");

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let active_tournament = tournaments[tournaments.active_tournament];

		let embed = new MessageEmbed()
			.setTitle(
				"Tournaments in guild: **" + interaction.guild.name + "**"
			)
			.addField(
				`Active Tournament: \`${tournaments.active_tournament}\``,
				stripIndent`
				\`\`\`
				Name: ${active_tournament.rules.name}
				Acronym: ${tournaments.active_tournament}
				Score Mode: ${active_tournament.rules.score_mode}
				Team Mode: ${active_tournament.rules.team_mode}
				Force NF: ${active_tournament.rules.force_nf}
				\`\`\`
			`
			);

		await interaction.editReply({ embeds: [embed] });
	},
};
