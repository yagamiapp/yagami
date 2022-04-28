const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { fetchGuild, prisma } = require("../../../prisma");
let { MessageEmbed } = require("discord.js");
let { execute } = require("../../buttons/team_list");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("List the teams"),
	async execute(interaction) {
		await interaction.deferReply();
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		let teams = await prisma.team.findMany({
			where: {
				tournamentId: tournament.id,
			},
		});

		// In case there is no tournament
		if (!tournament) {
			let embed = new MessageEmbed().setDescription(
				"**Err**: There is no active tournament"
			);
			await interaction.reply({ embeds: [embed] });
			return;
		}

		// In case there are no teams
		if (!teams) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: There are no teams in this tournament.")
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		execute(interaction, { options: { index: 0 } });
	},
};
