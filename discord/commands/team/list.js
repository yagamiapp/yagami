const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { getData } = require("../../../firebase");
let { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
let { execute } = require("../../buttons/team_list");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("List the teams"),
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

		// In case there are no teams
		if (tournament.rounds.length == 0) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: There are no teams in this tournament.")
				.setColor("RED");
			await interaction.reply({ embeds: [embed] });
			return;
		}

		execute(interaction, { options: { index: 0 } });
	},
};
