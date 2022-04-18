const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { getData, setData } = require("../../../firebase");
let { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags/lib");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("edit")
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
		)
		.addBooleanOption((option) =>
			option
				.setName("show_mappool")
				.setDescription(
					"Whether the round's mappool is visible to players or not"
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

		let acronym = interaction.options.getString("acronym").toUpperCase();
		let round = tournament?.rounds?.[acronym];
		let options = interaction.options.data[0].options;

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

		options.forEach((element) => {
			let prop = element.name;
			if (prop == "acronym") return;
			round[prop] = element.value;
		});

		await setData(
			round,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament,
			"rounds",
			acronym
		);

		let embed = new MessageEmbed()
			.setColor(tournament.settings.color)
			.setTitle("Settings Updated")
			.setDescription(
				stripIndents`
                **${acronym}**: ${round.name}
				Best of **${round.best_of}**
				Bans: **${round.bans}**
				Mappool Visible: **${round.show_mappool}**
            `
			)
			.setThumbnail(tournament.settings.icon_url);
		await interaction.editReply({ embeds: [embed] });
	},
};
