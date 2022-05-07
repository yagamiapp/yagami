const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
let { execute } = require("../../buttons/round_list");
const { convertAcronymToEnum } = require("../../../bancho/modEnum");
const { fetchGuild, prisma } = require("../../../prisma");
let nodesu = require("nodesu");
require("dotenv").config();

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("bulkaddmap")
		.setDescription("Adds multiple maps to a round from a spreadsheet")
		.addStringOption((option) =>
			option
				.setName("acronym")
				.setDescription("The acronym for your round")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("identifier_column")
				.setDescription("Column of map identifiers e.g. NM1")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("id_column")
				.setDescription("Column of map IDs")
				.setRequired(true)
		),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);

		let tournament = guild.active_tournament;
		let ids = interaction.options
			.getString("identifier_column")
			.match(/\S+/g);
		let maps = interaction.options.getString("id_column").match(/\d+/g);
		let acronym = interaction.options.getString("acronym");
		let embed = new MessageEmbed()
			.setTitle("Importing maps")
			.setColor("#F88000");
		let client = new nodesu.Client(process.env.banchoAPIKey);

		for (let i = 0; i < ids.length; i++) {
			let identifier = ids[i];
			embed.setDescription(
				`<a:loading:970406520124764200> Currently Importing: **${identifier}**`
			);
			await interaction.editReply({ embeds: [embed] });

			let mods = identifier.match(/\w{2}/)[0];
			let modEnum = convertAcronymToEnum(mods);
			let round = await prisma.round.findFirst({
				where: { tournamentId: tournament.id },
			});

			// In case the round doesn't exist
			if (round == null) {
				let embed = new MessageEmbed()
					.setDescription(
						`**Err**: A round with the acronym ${acronym} does not exist.`
					)
					.setColor("RED")
					.setFooter({
						text: "You can create a round using /rounds create",
					});
				await interaction.editReply({ embeds: [embed] });
				return;
			}

			// In case the map identifier has already been used
			let duplicate = await prisma.map.findFirst({
				where: { identifier: identifier, roundId: round.id },
			});
			if (duplicate) {
				let embed = new MessageEmbed()
					.setDescription(
						`**Err**: The identifier ${identifier} has already been used.`
					)
					.setColor("RED");
				await interaction.editReply({ embeds: [embed] });
				return;
			}

			switch (mods) {
				case "NM":
					mods = "";
					break;
				case "FM":
					mods = "Freemod";
					break;
				case "TB":
					mods = "Freemod";
					break;
				default:
					break;
			}

			let mapID = maps[i];

			if (modEnum == 8 || modEnum == 9) modEnum = 0;

			let map = await client.beatmaps.getByBeatmapId(mapID);
			map = map[0];
			map.identifier = identifier;
			map.mods = mods;
			map.approved_date = new Date(map.approved_date);
			map.submit_date = new Date(map.submit_date);
			map.last_update = new Date(map.last_update);
			map.roundId = round.id;

			await prisma.map.create({ data: map });
		}

		execute(interaction, { options: { index: 0 } });
	},
};
