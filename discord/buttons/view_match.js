let { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new MessageButton().setCustomId("view_match"),
	async execute(interaction, command) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		let round = await prisma.round.findFirst({
			where: {
				tournamentId: tournament.id,
				acronym: command.options.round,
			},
		});
		let match = await prisma.match.findFirst({
			where: { roundId: round.id, id: parseInt(command.options.id) },
		});
		let teams = await prisma.team.findMany({
			where: { TeamInMatch: { some: { matchId: match.id } } },
		});

		let back = new MessageActionRow().addComponents([
			new MessageButton()
				.setCustomId(
					"match_start_list?index=" +
						command.options.index +
						"&round=" +
						command.options.round
				)
				.setLabel("◀ Back to Matches")
				.setStyle("DANGER"),
		]);

		let embed = new MessageEmbed()
			.setTitle(`${round.acronym}: ${teams[0].name} vs ${teams[1].name}`)
			.setColor(tournament.color)
			.setThumbnail(tournament.icon_url);

		// Construct team strings
		for (let team of teams) {
			let teamString = "";
			let members = await prisma.user.findMany({
				where: {
					in_teams: {
						some: {
							teamId: team.id,
						},
					},
				},
			});
			for (let i = 0; i < members.length; i++) {
				let member = members[i];
				let rank = member.osu_pp_rank;
				if (rank == null) {
					rank = "Unranked";
				} else {
					rank = `${rank.toLocaleString()}`;
				}

				teamString += `
                    :flag_${member.osu_country_code.toLowerCase()}: ${
					member.osu_username
				} (#${rank})`;
				if (i == 0) {
					teamString += " **(c)**";
				}
			}
			embed.addField(team.name, teamString, true);
		}

		if (interaction.isCommand()) {
			await interaction.editReply({
				embeds: [embed],
			});
			return;
		}
		await interaction.update({
			embeds: [embed],
			components: [back],
		});
	},
};
