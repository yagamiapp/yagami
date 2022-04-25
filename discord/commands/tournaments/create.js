const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { prisma } = require("../../../prisma");
let { stripIndent } = require("common-tags");
let { MessageEmbed } = require("discord.js");

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
			option.setName("name").setDescription("The name for your tournament")
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
		.addIntegerOption((option) =>
			option
				.setName("team_mode")
				.setDescription("Changes the way users play in the lobby")
				.addChoice("Head to Head", 0)
				.addChoice("Tag Coop", 1)
				.addChoice("Team Vs", 2)
				.addChoice("Tag Team Vs", 3)
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
				.setDescription("How many players are playing against eachother")
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
				.setDescription("Set a custom color for your tournament e.g.(#0EB8B9)")
		),
	async execute(interaction) {
		let acronym = interaction.options.getString("acronym");
		acronym = acronym.toUpperCase();

		let duplicate = await prisma.tournament.findFirst({
			where: {
				Guild_id: interaction.guildId,
				acronym: acronym,
			},
		});
		if (duplicate) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: A tournament with the acronym \`${acronym}\` already exists.`
				)
				.setColor("RED");
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
			XvX_mode: interaction.options.getInteger("x_v_x_mode") || 1,
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
		let embed = new MessageEmbed()
			.setColor("#F88000")
			.setTitle("Tournament Creation Success")
			.setDescription(message)
			.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png")
			.addField(
				"Change the settings of the tournament:",
				stripIndent`
				\`\`\`
				/tournament edit
				\`\`\`
				`
			)
			.addField(
				"Begin making your first mappool",
				stripIndent`
				\`\`\`
				/rounds create
				\`\`\`
				`
			)
			.addField(
				"Add teams to your tournament",
				stripIndent`
				\`\`\`
				/teams create
				\`\`\`
				`
			)
			.addField(
				"Make your first match",
				stripIndent`
				\`\`\`
				/matches create
				\`\`\`
				`
			);
		await interaction.editReply({ embeds: [embed] });
	},
};
