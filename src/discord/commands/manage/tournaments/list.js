const { fetchGuild } = require("../../../../lib/prisma");
const { SlashCommandSubcommandBuilder } = require("discord.js");
let { EmbedBuilder, Colors } = require("discord.js");

let enums = {
	score_mode: {
		0: "Score",
		1: "Combo",
		2: "Accuracy",
		3: "ScoreV2",
		4: "ScoreV2 Accuracy",
	},
	team_mode: {
		0: "Head to Head",
		1: "Tag Team",
		2: "TeamVS",
		3: "Tag Team VS",
	},
	double_pick: {
		0: "No",
		1: "NM Excluded",
		2: "Yes",
	},
	double_ban: {
		0: "No",
		1: "NM Excluded",
		2: "Yes",
	},
};

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("Lists all tournaments in this guild"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let tournaments = guild.tournaments;

		if (tournaments == null) {
			let embed = new EmbedBuilder()
				.setDescription("**Err**:No Tournaments Found")
				.setColor(Colors.Red)
				.setFooter({
					text: "You can create a tournament with tournament create",
				});

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let active_tournament = guild.active_tournament;

		let embed = new EmbedBuilder()
			.setColor(active_tournament.color || "#F88000")
			.setThumbnail(
				active_tournament.icon_url ||
					"https://yagami.clxxiii.dev/static/yagami%20var.png"
			)
			.setTitle(`${active_tournament.acronym}: ${active_tournament.name}`)
			.setImage(active_tournament.banner_url);

		let description = "";
		for (const key in active_tournament) {
			let prop = active_tournament[key];
			if (prop == null) continue;
			let ignoredProps = [
				"icon_url",
				"color",
				"name",
				"id",
				"Guild_id",
				"acronym",
				"banner_url",
			];
			if (ignoredProps.includes(key) || key.includes("multiplier"))
				continue;

			if (enums[key] != null) {
				prop = enums[key][prop];
			}
			let name = key;
			// Capitalize String
			name = name.charAt(0).toUpperCase() + name.slice(1);
			name = name.replace(/_/g, " ");

			description += `**${name}**: ${prop}\n`;
		}

		embed.setDescription(description);

		let tourneyString = "";
		for (const tournament of tournaments) {
			if (tournament.id != active_tournament.id)
				tourneyString += `[${tournament.acronym}]: ${tournament.name}`;
		}
		if (tourneyString != "") {
			embed.addFields({
				name: "Other Tournaments",
				value: tourneyString,
			});
		}

		await interaction.editReply({ embeds: [embed] });
	},
};
