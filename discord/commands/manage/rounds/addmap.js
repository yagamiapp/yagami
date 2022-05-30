const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
const { fetchGuild, prisma } = require("../../../../prisma");
const { fetchMap } = require("../../../../bancho/fetchMap.js");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("addmap")
		.setDescription("Adds a new map to a round")
		.addStringOption((option) =>
			option
				.setName("acronym")
				.setDescription("The acronym for your round")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("identifier")
				.setDescription("The identifer for the map e.g. NM1")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("map")
				.setDescription("The map link or ID")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("mods")
				.setDescription(
					"A string of mods to add to the map, we'll take it from the identifier by default"
				)
		),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		let identifier = interaction.options
			.getString("identifier")
			.toUpperCase();
		let acronym = interaction.options.getString("acronym").toUpperCase();
		let mods =
			interaction.options.getString("mods") ||
			identifier.match(/\w{2}/)[0];
		let round = await prisma.round.findFirst({
			where: { tournamentId: tournament.id, acronym },
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

		let mappool = await prisma.mappool.findFirst({
			where: {
				Round: {
					id: round.id,
				},
			},
		});

		// In case the map identifier has already been used
		let duplicate = await prisma.mapInPool.findFirst({
			where: { identifier: identifier, mappoolId: mappool.id },
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

		let mapID = interaction.options.getString("map").match(/\d+$/);

		let map = await fetchMap(mapID[0]);

		await prisma.mapInPool.create({
			data: {
				mappoolId: mappool.id,
				mapId: map.beatmap_id,
				identifier: identifier,
				mods: mods,
			},
		});

		let embed = new MessageEmbed()
			.setTitle("Map Added")
			.setDescription(
				`**[${identifier}]:** ${map.artist} - ${map.title} [${map.version}]`
			)
			.setImage(
				`https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/cover.jpg`
			)
			.setColor(tournament.color)
			.setThumbnail(tournament.icon_url);

		await interaction.editReply({ embeds: [embed] });
	},
};
