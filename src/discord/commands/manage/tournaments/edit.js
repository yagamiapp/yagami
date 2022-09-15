let { EmbedBuilder, Colors } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("discord.js");
const { fetchGuild, prisma } = require("../../../../lib/prisma");
let { stripIndents } = require("common-tags");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("edit")
		.setDescription("Edits the currently selected tournament")
		.addStringOption((option) =>
			option
				.setName("acronym")
				.setDescription("Change the acronym of your tournament")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("The name for your tournament")
		)
		.addIntegerOption((option) =>
			option
				.setName("score_mode")
				.setDescription(
					"Changes the way scores are handled in the lobby"
				)
				.setChoices(
					{ name: "Score", value: 0 },
					{ name: "Combo", value: 1 },
					{ name: "Accuracy", value: 2 },
					{ name: "ScoreV2", value: 3 },
					{ name: "ScoreV2 Accuracy", value: 4 }
				)
		)
		.addIntegerOption((option) =>
			option
				.setName("team_mode")
				.setDescription("Changes the way users play in the lobby")
				.setChoices(
					{ name: "Head to Head", value: 0 },
					{ name: "Tag Coop", value: 1 },
					{ name: "Team Vs", value: 2 },
					{ name: "Tag Team Vs", value: 3 }
				)
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
		)
		.addIntegerOption((option) =>
			option
				.setName("x_v_x_mode")
				.setDescription(
					"How many players are playing against eachother"
				)
				.setMinValue(1)
				.setMaxValue(8)
		)
		.addStringOption((option) =>
			option
				.setName("icon_url")
				.setDescription("Set a custom icon for your tournament")
		)
		.addStringOption((option) =>
			option
				.setName("color")
				.setDescription(
					"Set a custom color for your tournament e.g.(#0EB8B9)"
				)
		)
		.addIntegerOption((option) =>
			option
				.setName("double_pick")
				.setDescription("Whether double picks are allowed or not")
				.setChoices(
					{ name: "No double picking", value: 0 },
					{ name: "No double picking NM excluded", value: 1 },
					{ name: "Double picking", value: 2 }
				)
		)
		.addIntegerOption((option) =>
			option
				.setName("double_ban")
				.setDescription("Whether double bans are allowed or not")
				.setChoices(
					{ name: "No double banning", value: 0 },
					{ name: "No double banning NM excluded", value: 1 },
					{ name: "Double banning", value: 2 }
				)
		)
		.addIntegerOption((option) =>
			option
				.setName("fm_mods")
				.setDescription("How many mods are required per-team for FM")
				.setMinValue(0)
				.setMaxValue(8)
		),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let options = interaction.options.data[0].options[0].options;

		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		if (!tournament) {
			let embed = new EmbedBuilder()
				.setDescription("**Err**: No Active Tournament Found")
				.setColor(Colors.Red)
				.setFooter({
					text: "You can create a tournament with /tournament create",
				});

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case registration is enabled
		if (tournament.allow_registrations) {
			let embed = new EmbedBuilder()
				.setDescription(
					"**Err**: You cannot edit tournament settings while registration is allowed."
				)
				.setColor(Colors.Red)
				.setFooter({
					text: "You can disable registration with /tournament registration",
				});
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the icon_url does not lead to an image
		let urlRegex = /(?:http|https).+(?:jpg|jpeg|png|webp|gif|svg)/;
		if (
			interaction.options.getString("icon_url") &&
			!urlRegex.test(interaction.options.getString("icon_url"))
		) {
			let embed = new EmbedBuilder()
				.setDescription(
					"**Err**: The icon url you provided is not a valid image."
				)
				.setColor(Colors.Red)
				.setFooter({ text: "The url must lead to an image" });
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the color is not a valid hex color
		if (
			interaction.options.getString("color") &&
			!/#[1234567890abcdefABCDEF]{6}/.test(
				interaction.options.getString("color")
			)
		) {
			let embed = new EmbedBuilder()
				.setDescription(
					"**Err**: The color you provided is not a valid hex color."
				)
				.setColor(Colors.Red)
				.setFooter({
					text: "The color must be in the following format: #0eB8b9",
				});
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		options.forEach((element) => {
			let prop = element.name;
			tournament[prop] = element.value;
		});

		// If the acronym is changed, we need to update the active_tournament
		await prisma.tournament.update({
			where: { id: tournament.id },
			data: tournament,
		});

		let embed = new EmbedBuilder()
			.setTitle("Successfully changed settings!")
			.setColor(tournament.color || "GREEN")
			.setDescription(
				stripIndents`
				**Name:** ${tournament.name}
				**Acronym:** ${tournament.acronym}
				**Score Mode:** ${tournament.score_mode}
				**Team Mode:** ${tournament.team_mode}
				**Team Size:** ${tournament.team_size}
				**Force NF:** ${tournament.force_nf}
				`
			)
			.setThumbnail(
				tournament.icon_url ||
					"https://yagami.clxxiii.dev/static/yagami%20var.png"
			);
		await interaction.editReply({ embeds: [embed] });
	},
};
