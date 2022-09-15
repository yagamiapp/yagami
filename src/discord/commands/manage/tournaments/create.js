const { SlashCommandSubcommandBuilder, Colors } = require("discord.js");
const { prisma } = require("../../../../lib/prisma");
let { stripIndent } = require("common-tags");
let { EmbedBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create a new tournament")
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
		let acronym = interaction.options.getString("acronym");
		acronym = acronym.toUpperCase();

		let duplicate = await prisma.tournament.findFirst({
			where: {
				Guild_id: interaction.guildId,
				acronym: acronym,
			},
		});
		if (duplicate) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: A tournament with the acronym \`${acronym}\` already exists.`
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// Construct tourney object
		let tourney = {
			acronym,
			name: interaction.options.getString("name") ?? "My Tournament",
			score_mode: interaction.options.getInteger("score_mode") ?? 3,
			team_mode: interaction.options.getInteger("team_mode") ?? 0,
			force_nf: interaction.options.getBoolean("force_nf") ?? true,
			color: interaction.options.getString("color") ?? "#F88000",
			team_size: interaction.options.getInteger("team_size") ?? 1,
			icon_url:
				interaction.options.getString("icon_url") ??
				"https://yagami.clxxiii.dev/static/yagami%20var.png",
			allow_registrations: false,
			x_v_x_mode: interaction.options.getInteger("x_v_x_mode") || 1,
			double_pick: interaction.options.getInteger("double_pick") || 1,
			double_ban: interaction.options.getInteger("double_ban") || 1,
			fm_mods: interaction.options.getInteger("fm_mods") || 1,
			Guild_id: interaction.guildId,
		};

		let tournament = await prisma.tournament.create({
			data: tourney,
		});

		prisma.guild
			.update({
				where: {
					guild_id: interaction.guildId,
				},
				data: {
					active_tournament: tournament.id,
				},
			})
			.then(console.log);

		let message = stripIndent`
				Woohoo! 🥳 Your new tournament, \`${acronym}\` has been created!
				Currently, your tournament's name is \`${tourney.name}\`, but you can change that!

				Here are the next steps to get things running:
			`;
		let embed = new EmbedBuilder()
			.setColor("#F88000")
			.setTitle("Tournament Creation Success")
			.setDescription(message)
			.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png")
			.addFields(
				{
					name: "Change the settings of the tournament:",
					value: stripIndent`
				\`\`\`
				/manage tournaments edit
				\`\`\`
				`,
				},
				{
					name: "Begin making your first mappool",
					value: stripIndent`
				\`\`\`
				/manage rounds create
				\`\`\`
				`,
				},
				{
					name: "Add teams to your tournament",
					value: stripIndent`
				\`\`\`
				/manage teams create
				\`\`\`
				`,
				},
				{
					name: "Make your first match",
					value: stripIndent`
				\`\`\`
				/manage matches create
				\`\`\`
				`,
				}
			);
		await interaction.editReply({ embeds: [embed] });
	},
};
