const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { getData, pushData } = require("../../../firebase");
let { MessageEmbed } = require("discord.js");
const { convertAcronymToEnum } = require("../../../bancho/modEnum");
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
		let active_tournament = await getData(
			"guilds",
			interaction.guild.id,
			"tournaments",
			"active_tournament"
		);

		let tournament = await getData(
			"guilds",
			interaction.guild.id,
			"tournaments",
			active_tournament
		);

		let identifier = interaction.options
			.getString("identifier")
			.toUpperCase();
		let acronym = interaction.options.getString("acronym").toUpperCase();
		let mods =
			interaction.options.getString("mods") ||
			identifier.match(/\w{2}/)[0];
		let round = tournament.rounds?.[acronym];
		let modEnum = convertAcronymToEnum(mods);

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

		// In case the round doesn't exist
		if (round == null) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: A round with the acronym ${acronym} does not exist.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let mapID = interaction.options.getString("map").match(/\d+$/);

		let req_url = `https://osu.ppy.sh/api/get_beatmaps?k=${process.env.banchoAPIKey}&b=${mapID}&mods=${modEnum}`;
		let data = await axios.get(req_url);

		data = data.data[0];
		let map = {
			identifier,
			mods,
			data,
		};

		await pushData(
			map,
			"guilds",
			interaction.guild.id,
			"tournaments",
			active_tournament,
			"rounds",
			acronym,
			"pool"
		);

		let length = `${Math.floor(map.data.total_length / 60)}:${
			map.data.total_length % 60
		}`;
		let difficulty = `${
			Math.round(map.data.difficultyrating * 100) / 100
		}☆`;

		let embed = new MessageEmbed()
			.setTitle("Map Added")
			.setDescription(
				`**[${identifier}]:** ${map.data.artist} - ${map.data.title} [${map.data.version}]`
			)
			.setImage(
				`https://assets.ppy.sh/beatmaps/${map.data.beatmapset_id}/covers/cover.jpg`
			)
			.setColor(tournament.settings.color)
			.setThumbnail(tournament.settings.icon_url)
			.addField(
				"CS/AR/OD/HP",
				`${map.data.diff_size}/${map.data.diff_approach}/${map.data.diff_overall}/${map.data.diff_drain}`,
				true
			)
			.addField("BPM", map.data.bpm, true)
			.addField("Length", length, true)
			.addField("Star Rating", difficulty, true);

		await interaction.editReply({ embeds: [embed] });
	},
};
