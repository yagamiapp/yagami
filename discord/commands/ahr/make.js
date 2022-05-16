const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { prisma } = require("../../../prisma");
const { Lobby } = require("../../../bancho/match-types/auto-host-rotate/Lobby");
const { MessageEmbed } = require("discord.js");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("make")
		.setDescription("Make a auto host rotate lobby")
		.addStringOption((option) =>
			option
				.setName("mp_link")
				.setDescription("The link to your match")
				.setRequired(true)
		)
		.addNumberOption((option) =>
			option
				.setName("min_stars")
				.setDescription("The minimum amount of stars a map must be")
				.setMinValue(0)
		)
		.addNumberOption((option) =>
			option
				.setName("max_stars")
				.setDescription("The maximum amount of stars a map must be")
				.setMinValue(0.001)
		)
		.addIntegerOption((option) =>
			option
				.setName("min_length")
				.setDescription("The minimum length of a map in seconds")
				.setMinValue(0)
		)
		.addIntegerOption((option) =>
			option
				.setName("max_length")
				.setDescription("The maximum length of a map in seconds")
				.setMinValue(1)
		)
		.addIntegerOption((option) =>
			option
				.setName("max_rank")
				.setDescription("The highest rank a player can be")
				.setMinValue(1)
		),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		// Check for duplicates
		let duplicate = await prisma.autoHostRotate.findMany({
			where: {
				discordId: interaction.user.id,
			},
		});
		if (duplicate.length > 0) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: You already have a auto host rotate lobby."
				)
				.setColor("RED");
			return interaction.editReply({ embeds: [embed] });
		}

		// Check the mp link is valid
		let mp_link = interaction.options.getString("mp_link");
		mp_link.match(
			/^https:\/\/osu.ppy.sh\/(mp\/\d+|community\/matches\/\d+)$/
		);
		if (!mp_link) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: The mp link is invalid.")
				.setColor("RED")
				.setFooter({
					text: "Please make sure it is a valid osu! multiplayer link.",
				});
			return interaction.editReply({ embeds: [embed] });
		}

		// Create the lobby
		await prisma.autoHostRotate.create({
			data: {
				discordId: interaction.user.id,
				mp_link: interaction.options.getString("mp_link"),
				min_stars: interaction.options.getNumber("min_stars") || 0,
				max_stars: interaction.options.getNumber("max_stars"),
				min_length: interaction.options.getInteger("min_length") || 0,
				max_length: interaction.options.getInteger("max_length"),
				max_rank: interaction.options.getInteger("max_rank") || 1,
				min_rank: interaction.options.getInteger("min_rank"),
			},
		});

		let embed = new MessageEmbed();
		embed
			.setTitle("Loading match")
			.setDescription(
				"<a:loading:970406520124764200> We're currently setting up your lobby..."
			)
			.setColor("#F88000");
		await interaction.editReply({ embeds: [embed] });

		let lobby = new Lobby(interaction.user.id);
		try {
			await lobby.load();
		} catch (e) {
			console.log(e);
		}
	},
};
