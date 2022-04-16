let { MessageEmbed } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const firebase = require("../../../firebase");
module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("activate")
		.setDescription("Changes which tournament the other commands apply to")
		.addStringOption((option) =>
			option
				.setName("acronym")
				.setDescription("The acronym of the tournament")
				.setRequired(true)
		),
	async execute(interaction) {
		let acro = interaction.options.getString("acronym").toUpperCase();

		let tournaments = await firebase.getData(
			"guilds",
			interaction.guildId,
			"tournaments"
		);

		let acroArray = [];
		for (let key in tournaments) {
			if (!(key == "active_tournament")) acroArray.push(key);
		}

		if (!acroArray.includes(acro)) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: No tournament with the acronym \`${acro}\` found.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let tournamentName = tournaments[acro].rules.name;

		await firebase.setData(
			acro,
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);

		let embed = new MessageEmbed()
			.setTitle("Active Tournament Updated!")
			.setDescription(
				`Active tournament switched to \`${tournamentName}\``
			)
			.setColor("GREEN");

		await interaction.editReply({ embeds: [embed] });
	},
};
