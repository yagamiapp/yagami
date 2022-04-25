let { MessageEmbed } = require("discord.js");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { fetchGuild, prisma } = require("../../../prisma");
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

		let tournament = prisma.tournament.findFirst({
			where: {
				acronym: acro,
				Guild_id: interaction.guildId,
			},
		});

		if (!tournament) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: No tournament with the acronym \`${acro}\` found.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		await prisma.guild.update({
			where: { guild_id: interaction.guildId },
			data: { active_tournament: tournament.id },
		});

		let embed = new MessageEmbed()
			.setTitle("Active Tournament Updated!")
			.setDescription(`Active tournament switched to \`${tournamentName}\``)
			.setColor("GREEN");

		await interaction.editReply({ embeds: [embed] });
	},
};
