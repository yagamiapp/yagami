const { getData } = require("../../firebase");
let { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { stripIndents } = require("common-tags/lib");

module.exports = {
	data: new MessageButton().setCustomId("team_list"),
	async execute(interaction, command) {
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

		let users = await getData("users");

		// In case there are no teams
		if (!tournament.users) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: There are no teams in this tournament.")
				.setColor("RED");
			await interaction.reply({ embeds: [embed] });
			return;
		}

		// Put teams into array
		let teams = [];
		for (let id in tournament.users) {
			let user = tournament.users[id];
			if (user.name) {
				teams.push(user);
			}
		}
		// Sort teams by average rank
		teams.sort((a, b) => {
			let aAvg = 0;
			let bAvg = 0;
			for (let i = 0; i < a.members.length; i++) {
				let user = users[a.members[i]];
				if (user.osu.statistics.global_rank) {
					aAvg += user.osu.statistics.global_rank;
				}
			}
			for (let i = 0; i < b.members.length; i++) {
				let user = users[b.members[i]];
				if (user.osu.statistics.global_rank) {
					bAvg += user.osu.statistics.global_rank;
				}
			}

			aAvg /= a.members.length;
			bAvg /= b.members.length;
			return aAvg - bAvg;
		});

		// Group elements into groups of 6
		let groups = [];
		let groupSize = 6;
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
			.setColor(tournament.settings.color || "#F88000")
			.setThumbnail(tournament.settings.icon_url);

		for (let i = 0; i < group.length; i++) {
			let team = group[i];
			let teamString = "";

			for (let i = 0; i < team.members.length; i++) {
				let member = team.members[i];
				let memberData = await getData("users", member);
				let rank = memberData.osu.statistics.global_rank;
				if (rank == null) {
					rank = "Unranked";
				} else {
					rank = `${rank.toLocaleString()}`;
				}

				teamString += `
				:flag_${memberData.osu.country_code.toLowerCase()}: ${
					memberData.osu.username
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
