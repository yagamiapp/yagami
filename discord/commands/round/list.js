const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { getData } = require("../../../firebase");
let { MessageEmbed } = require("discord.js");
let { execute } = require("../../buttons/round_list");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("List the rounds"),
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

		// In case there are no rounds
		if (!tournament.rounds) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: There are no rounds in this tournament."
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		execute(interaction, { options: { index: 0 } });
	},
};
