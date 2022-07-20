const { SlashCommandSubcommandBuilder } = require("discord.js");
let { EmbedBuilder, Colors } = require("discord.js");
let { execute } = require("../../../buttons/rounds_list");
const { fetchGuild, prisma } = require("../../../../prisma");
const { fetchMap } = require("../../../../bancho/fetchMap");

let modPrioEnum = {
	NM: 0,
	HD: 1,
	HR: 2,
	DT: 3,
	HT: 4,
	EZ: 5,
	FL: 6,
	FM: 8,
	TB: 9,
};

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
		let embed = new EmbedBuilder()
			.setTitle("Importing maps")
			.setColor("#F88000");

		let round = await prisma.round.findFirst({
			where: { tournamentId: tournament.id, acronym: acronym },
		});

		// In case the round doesn't exist
		if (round == null) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: A round with the acronym ${acronym} does not exist.`
				)
				.setColor(Colors.Red)
				.setFooter({
					text: "You can create a round using /rounds create",
				});
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let mappool = await prisma.mappool.findFirst({
			where: {
				Round: {
					id: round.id,
				},
			},
		});

		for (let i = 0; i < ids.length; i++) {
			let identifier = ids[i].toUpperCase();
			embed.setDescription(
				`<a:loading:970406520124764200> Currently Importing: **${identifier}**`
			);
			await interaction.editReply({ embeds: [embed] });

			// In case the map identifier has already been used
			let duplicate = await prisma.mapInPool.findFirst({
				where: { identifier: identifier, mappoolId: mappool.id },
			});
			if (duplicate) {
				let embed = new EmbedBuilder()
					.setDescription(
						`**Err**: The identifier ${identifier} has already been used.`
					)
					.setColor(Colors.Red);
				await interaction.editReply({ embeds: [embed] });
				return;
			}

			let mods = identifier.match(/\w{2}/)[0];

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
			let map = await fetchMap(mapID);

			let modType = identifier.match(/\w{2}/g)[0];
			let modPriority = modPrioEnum[modType];
			if (modPriority == undefined) modPriority = 7;

			await prisma.mapInPool.create({
				data: {
					mappoolId: mappool.id,
					mapId: map.beatmap_id,
					identifier: identifier,
					mods: mods,
					modPriority,
				},
			});
		}

		execute(interaction, { options: { index: 0, admin: true } });
	},
};
