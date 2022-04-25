const { fetchGuild } = require("../../../prisma");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
let { stripIndents } = require("common-tags");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("Lists all tournaments in this guild"),
	async execute(interaction) {
		let guild = await fetchGuild(interaction.guildId);
		let tournaments = guild.tournaments;

		if (tournaments == null) {
			let embed = new MessageEmbed()
				.setDescription("**Err**:No Tournaments Found")
				.setColor("RED");

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let active_tournament = guild.active_tournament;

		let embed = new MessageEmbed()
			.setTitle("Tournaments in this server:")
			.setColor(active_tournament.color || "#F88000")
			.setThumbnail(
				active_tournament.icon_url ||
					"https://yagami.clxxiii.dev/static/yagami%20var.png"
			)
			.setDescription(
				stripIndents`
				Active Tournament: **${active_tournament.name}**
				\`\`\`
				Acronym: ${active_tournament.acronym}
				Score Mode: ${active_tournament.score_mode}
				Team Mode: ${active_tournament.team_mode}
				Force NF: ${active_tournament.force_nf}
				Team Size: ${active_tournament.team_size}
				\`\`\`
				`
			);

		let tourneyString = "";
		for (const tournament of tournaments) {
			if (tournament.id != active_tournament.id)
				tourneyString += `[${tournament.acronym}]: ${tournament.name}`;
		}
		if (!(tourneyString == "")) {
			embed.addField("Other Tournaments", tourneyString);
		}

		await interaction.editReply({ embeds: [embed] });
	},
};
