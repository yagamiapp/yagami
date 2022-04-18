const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { getData, setData } = require("../../../firebase");
let { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags/lib");

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

		console.log("Creating a new round with the acronym: " + acronym);

		console.log("Checking if round Already Exists:");
		let test = tournament?.rounds?.[acronym];

		if (test) {
			console.log("Test Failed");

			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: A round with the acronym `" +
						acronym +
						"` already exists in tournament: " +
						active_tournament
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		console.log("Test passed! Writing data to database");

		// Construct round object
		let round = {
			name: "New Round",
			best_of: interaction.options.getInteger("best_of") ?? 11,
			bans: interaction.options.getInteger("bans") ?? 2,
			show_mappool: false,
		};
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
			.setTitle("New round created!")
			.setDescription(
				stripIndents`
                A new round with the acronym \`${acronym}\` has been created in the tournament: \`${tournament.settings.name}\`
                To add a new map, use the command: \`/round \`
            `
			)
			.setThumbnail(tournament.settings.icon_url);
		await interaction.editReply({ embeds: [embed] });
	},
};
