let { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new MessageButton().setCustomId("team_list"),
	async execute(interaction, command) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		let teams = await prisma.team.findMany({
			where: {
				tournamentId: tournament.id,
			},
		});

		// In case there are no teams
		if (teams.length == 0) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: There are no teams in this tournament."
				)
				.setColor("RED");
			await interaction.reply({ embeds: [embed] });
			return;
		}

		// Add member objects to each team
		for (const team of teams) {
			let membersInTeam = await prisma.user.findMany({
				where: {
					in_teams: {
						some: {
							teamId: team.id,
						},
					},
				},
			});
			team.members = membersInTeam;
		}
		// Sort teams by average rank
		teams.sort((a, b) => {
			let aAvg = 0;
			let bAvg = 0;

			for (let i = 0; i < a.members.length; i++) {
				let user = a.members[i];
				if (user.osu_pp_rank) {
					aAvg += user.osu_pp_rank;
				}
			}

			for (let i = 0; i < b.members.length; i++) {
				let user = b.members[i];
				if (user.osu_pp_rank) {
					bAvg += user.osu_pp_rank;
				}
			}

			aAvg /= a.members.length;
			bAvg /= b.members.length;
			console.log(`${bAvg} - ${aAvg}`);
			return aAvg - bAvg;
		});
		// Group elements into groups of 3
		let groups = [];
		let groupSize = 3;
		for (let i = 0; i < teams.length; i += groupSize) {
			groups.push(teams.slice(i, i + groupSize));
		}
		let index = parseInt(command.options.index);

		// Select first round and build embed
		let group = groups[index];

		// Build buttons to scroll to other rounds
		let components = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId("team_list?index=" + (index - 1))
				.setLabel("◀")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("placeholder")
				.setLabel(`${index + 1}/${groups.length}`)
				.setStyle("SECONDARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId("team_list?index=" + (index + 1))
				.setLabel("▶")
				.setStyle("PRIMARY")
		);

		if (index == 0) {
			components.components[0].disabled = true;
		}

		if (index == groups.length - 1) {
			components.components[2].disabled = true;
		}

		let embed = new MessageEmbed()
			.setTitle("Teams")
			.setColor(tournament.color || "#F88000")
			.setThumbnail(tournament.icon_url);

		for (let i = 0; i < group.length; i++) {
			let team = group[i];
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
			embed.addField(team.name, teamString);
		}

		if (interaction.isCommand()) {
			await interaction.editReply({
				embeds: [embed],
				components: [components],
			});
			return;
		}
		await interaction.update({
			embeds: [embed],
			components: [components],
		});
	},
};
