const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
const { convertAcronymToEnum } = require("../../../bancho/modEnum");
const { fetchGuild, prisma } = require("../../../prisma");
let axios = require("axios").default;

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
		await interaction.deferReply();
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		let identifier = interaction.options.getString("identifier").toUpperCase();
		let acronym = interaction.options.getString("acronym").toUpperCase();
		let mods =
			interaction.options.getString("mods") || identifier.match(/\w{2}/)[0];
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
				.setFooter({ text: "You can create a round using /rounds create" });
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
			case "TB":
				mods = "FM";
				break;
			default:
				break;
		}

		let mapID = interaction.options.getString("map").match(/\d+$/);

		if (modEnum == 8 || modEnum == 9) modEnum = 0;

		let req_url = `https://osu.ppy.sh/api/get_beatmaps?k=${process.env.banchoAPIKey}&b=${mapID}&mods=${modEnum}`;
		let map = await axios.get(req_url);
		console.log(req_url);

		map = map.data[0];
		map.identifier = identifier;
		map.mods = mods;
		map.approved_date = new Date(map.approved_date);
		map.submit_date = new Date(map.submit_date);
		map.last_update = new Date(map.last_update);
		map.roundId = round.id;
		console.log(map);

		await prisma.map.create({ data: map });

		let length = `${Math.floor(map.total_length / 60)}:${
			map.total_length % 60 > 9
				? map.total_length % 60
				: "0" + (map.total_length % 60)
		}`;
		let difficulty = `${Math.round(map.difficultyrating * 100) / 100}☆`;

		let embed = new MessageEmbed()
			.setTitle("Map Added")
			.setDescription(
				`**[${identifier}]:** ${map.artist} - ${map.title} [${map.version}]`
			)
			.setImage(
				`https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/cover.jpg`
			)
			.setColor(tournament.color)
			.setThumbnail(tournament.icon_url)
			.addField(
				"CS/AR/OD/HP",
				`${map.diff_size}/${map.diff_approach}/${map.diff_overall}/${map.diff_drain}`,
				true
			)
			.addField("BPM", map.bpm, true)
			.addField("Length", length, true)
			.addField("Star Rating", difficulty, true);

		await interaction.editReply({ embeds: [embed] });
	},
};
