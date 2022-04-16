let firebase = require("../../../firebase");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
let { stripIndents } = require("common-tags");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("Lists all tournaments in this guild"),
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
			.setColor(active_tournament.settings.color || "#F88000")
			.setThumbnail(
				active_tournament.settings.icon_url ||
					"https://yagami.clxxiii.dev/static/yagami%20var.png"
			)
			.setDescription(
				stripIndents`
				Active Tournament: **${active_tournament.settings.name}**
				\`\`\`
				Name: ${active_tournament.settings.name}
				Acronym: ${tournaments.active_tournament}
				Score Mode: ${active_tournament.settings.score_mode}
				Team Mode: ${active_tournament.settings.team_mode}
				Force NF: ${active_tournament.settings.force_nf}
				\`\`\`
				`
			);

		let tourneyString = "";
		for (const key in tournaments) {
			if (key != tournaments.active_tournament && key != "active_tournament") {
				const element = tournaments[key];

				tourneyString += `**${key}:** ${element.settings?.name}\n`;
			}
		}
		if (!(tourneyString == "")) {
			embed.addField("Other Tournaments", tourneyString);
		}

		await interaction.editReply({ embeds: [embed] });
	},
};
