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
		// TODO: Compile teams into groups of 5 for each page

		let index = parseInt(command.options.index);

		// Select first round and build embed
		let team = teams[index];

		// Build buttons to scroll to other rounds
		let components = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId("team_list?index=" + (index - 1))
				.setLabel("⬅")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("placeholder")
				.setLabel(`${index + 1}/${teams.length}`)
				.setStyle("SECONDARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId("team_list?index=" + (index + 1))
				.setLabel("➡")
				.setStyle("PRIMARY")
		);

		if (index == 0) {
			components.components[0].disabled = true;
		}

		if (index == teams.length - 1) {
			components.components[2].disabled = true;
		}

		let embed = new MessageEmbed()
			.setTitle("Teams")
			.setColor(tournament.settings.color || "#F88000")
			.setThumbnail(tournament.settings.icon_url);
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
		embed.addField(team.name, teamString);

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
