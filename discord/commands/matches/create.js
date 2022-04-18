let { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
let { setData, getData } = require("../../../firebase");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Creates a new matchup")
		.addUserOption((option) =>
			option
				.setName("team1")
				.setDescription("Any user from the first team")
				.setRequired(true)
		)
		.addUserOption((option) =>
			option
				.setName("team2")
				.setDescription("Any user from the second team")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option.setName("round").setDescription("The round acronym")
		),
	async execute(interaction) {
		let active_tournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);

		let tournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		let roundAcronym = interaction.options.getString("round").toUpperCase();
		let round = tournament.rounds?.[roundAcronym];

		let users = [
			interaction.options.getUser("team1"),
			interaction.options.getUser("team2"),
		];

		let teams = [
			tournament.users?.[users[0].id]?.memberOf ||
				tournament.users?.[users[0].id],
			tournament.users?.[users[1].id]?.memberOf ||
				tournament.users?.[users[1].id],
		];

		// In case there is no tournament
		if (!tournament) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: There is no active tournament")
				.setColor("RED")
				.setFooter({
					text: "You can create a tournament with /tournament create",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the given acronym is not valid
		if (!round) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: The round acronym is not valid")
				.setColor("RED")
				.setFooter({
					text: "Use /rounds list to see all the rounds",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the team1 user is not on a team
		if (!teams[0]) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: The user from team 1 is not on a team"
				)
				.setColor("RED")
				.setFooter({
					text: "Use /teams list to see all the teams",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the team 2 user is not on a team
		if (!teams[1]) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: The user from team 2 is not on a team"
				)
				.setColor("RED")
				.setFooter({
					text: "Use /teams list to see all the teams",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the teams are the same
		if (teams[0] === teams[1]) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: The teams are the same")
				.setColor("RED")
				.setFooter({
					text: "Use /teams list to see all the teams",
				});
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// Add osu IDs to teams
		for (let team of teams) {
			let teamsOsuIDs = [];
			for (let member of team.members) {
				let user = await getData("users", member);
				teamsOsuIDs.push(user.osu.id);
			}
			team.user_ids = teamsOsuIDs;
		}

		let embed = new MessageEmbed()
			.setTitle("Matchup created")
			.setDescription("The matchup has been created")
			.setColor(tournament.settings.color)
			.setThumbnail(tournament.settings.icon_url);

		// Construct team strings
		for (let team of teams) {
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

		await interaction.editReply({ embeds: [embed] });
	},
};
