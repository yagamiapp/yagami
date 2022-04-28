const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
let { execute } = require("../../buttons/round_list");
const { fetchGuild, prisma } = require("../../../prisma");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("List the rounds"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		let rounds = await prisma.round.findMany({
			where: { tournamentId: tournament.id },
		});

		// In case there are no rounds
		if (rounds == []) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: There are no rounds in this tournament.")
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		execute(interaction, { options: { index: 0 } });
	},
};
