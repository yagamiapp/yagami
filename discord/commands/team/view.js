const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { getData } = require("../../../firebase");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("Edits your team")
		.addUserOption((option) =>
			option.setName("user").setDescription("Select a user to view the team of")
		),
	async execute(interaction) {
		let active_tournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);

		let currentTournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		let user = interaction.options.getUser("user") || interaction.user;

		if (!currentTournament.users[user.id]) {
			let embed = new MessageEmbed()
				.setDescription(`**Err**: That user is not in a team`)
				.setColor("RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}

		let team = currentTournament.users[user.id];
		team = currentTournament.users[team.memberOf] || team;

		let embed = new MessageEmbed()
			.setTitle(team.name)
			.setColor(team.color || "#F88000");
		if (team.icon_url) {
			embed.setThumbnail(team.icon_url);
		}
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
		embed.addField("Roster", teamString);

		await interaction.editReply({ embeds: [embed] });
	},
};
