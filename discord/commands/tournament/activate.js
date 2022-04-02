let { CommandInteraction, MessageEmbed } = require("discord.js");
const firebase = require("../../../firebase");
module.exports = {
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
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
