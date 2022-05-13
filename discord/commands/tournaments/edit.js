let { MessageEmbed } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { fetchGuild, prisma } = require("../../../prisma");
let { stripIndents } = require("common-tags");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("edit")
		.setDescription("Edits the currently selected tournament")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("The name for your tournament")
		)
		.addStringOption((option) =>
			option
				.setName("acronym")
				.setDescription("Change the acronym of your tournament")
		)
		.addIntegerOption((option) =>
			option
				.setName("score_mode")
				.setDescription(
					"Changes the way scores are handled in the lobby"
				)
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
		),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let options = interaction.options.data[0].options;

		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		if (!tournament) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: No Active Tournament Found")
				.setColor("RED")
				.setFooter({
					text: "You can create a tournament with /tournament create",
				});

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case registration is enabled
		if (tournament.allow_registrations) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: You cannot edit tournament settings while registration is allowed."
				)
				.setColor("RED")
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
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: The icon url you provided is not a valid image."
				)
				.setColor("RED")
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
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: The color you provided is not a valid hex color."
				)
				.setColor("RED")
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

		let embed = new MessageEmbed()
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
