const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags/lib");
const { fetchGuild, prisma } = require("../../../prisma");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create a new round")
		.addStringOption((option) =>
			option
				.setName("acronym")
				.setDescription("The acronym for your round")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option.setName("name").setDescription("The name for your round")
		)
		.addIntegerOption((option) =>
			option
				.setName("best_of")
				.setDescription("How many maps in a best of round")
				.setMinValue(1)
				.setMaxValue(21)
		)
		.addIntegerOption((option) =>
			option
				.setName("bans")
				.setDescription("How many bans each team is allowed in a round")
				.setMinValue(0)
				.setMaxValue(2)
		),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		let acronym = interaction.options.getString("acronym").toUpperCase();

		if (!tournament) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: There is no active tournament in this server."
				)
				.setColor("RED")
				.setFooter({
					text: "You can create a tournament with /tournament create",
				});
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let test = await prisma.round.findFirst({
			where: { acronym: acronym, tournamentId: tournament.id },
		});

		if (test) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: A round with the acronym `" +
						acronym +
						"` already exists in tournament: " +
						tournament.name
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let mappool = await prisma.mappool.create({
			data: {},
		});

		await prisma.round.create({
			data: {
				name: interaction.options.getString("name") ?? "New Round",
				acronym: acronym,
				best_of: interaction.options.getInteger("best_of") ?? 11,
				bans: interaction.options.getInteger("bans") ?? 2,
				tournamentId: tournament.id,
				show_mappool: false,
				mappoolId: mappool.id,
			},
		});

		let embed = new MessageEmbed()
			.setColor(tournament.color)
			.setTitle("New round created!")
			.setDescription(
				stripIndents`
                A new round with the acronym \`${acronym}\` has been created in the tournament: \`${tournament.name}\`
                To add a new map, use the command: \`/round \`
            `
			)
			.setThumbnail(tournament.icon_url);
		await interaction.editReply({ embeds: [embed] });
	},
};
