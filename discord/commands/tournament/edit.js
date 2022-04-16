let { MessageEmbed } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const firebase = require("../../../firebase");
let { stripIndents } = require("common-tags");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("edit")
		.setDescription("Edits the currently selected tournament")
		.addStringOption((option) =>
			option.setName("name").setDescription("The name for your tournament")
		)
		.addStringOption((option) =>
			option
				.setName("acronym")
				.setDescription("Change the acronym of your tournament")
		)
		.addIntegerOption((option) =>
			option
				.setName("score_mode")
				.setDescription("Changes the way scores are handled in the lobby")
				.addChoice("Score", 0)
				.addChoice("Combo", 1)
				.addChoice("Accuracy", 2)
				.addChoice("ScoreV2", 3)
				.addChoice("ScoreV2 Accuracy", 4)
		)
		.addBooleanOption((option) =>
			option
				.setName("force_nf")
				.setDescription("NF should be used with all maps")
		)
		.addIntegerOption((option) =>
			option
				.setName("team_size")
				.setDescription("Change the size of the team")
				.setMinValue(1)
				.setMaxValue(16)
		),
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

		if (tournament.allow_registration) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Error:** You cannot edit tournament settings while registration is allowed."
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let acronym = active_tournament;
		options.forEach((element) => {
			let prop = element.name;
			if (prop == "acronym") {
				acronym = element.value.toUpperCase();
			} else {
				tournament.settings[prop] = element.value;
			}
		});

		// If the acronym is changed, we need to update the active_tournament
		if (acronym != active_tournament) {
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
		} else {
			firebase.setData(
				tournament,
				"guilds",
				interaction.guildId,
				"tournaments",
				active_tournament
			);
		}

		let embed = new MessageEmbed()
			.setTitle("Successfully changed settings!")
			.setColor("GREEN")
			.setDescription(
				stripIndents`
				**Name:** ${tournament.settings.name}
				**Acronym:** ${acronym}
				**Score Mode:** ${tournament.settings.score_mode}
				**Team Mode:** ${tournament.settings.team_mode}
				**Team Size:** ${tournament.settings.team_size}
				**Force NF:** ${tournament.settings.force_nf}
				`
			);

		await interaction.editReply({ embeds: [embed] });
	},
};
