const { stripIndents } = require("common-tags/lib");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { getData } = require("../../../firebase");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("invite")
		.setDescription("Invite a user to your team")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user you want to invite")
				.setRequired(true)
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

		// Get data of invitee
		let invitee = interaction.options.getUser("user");
		let inviteeData = await getData("users", invitee.id);
		// Get data of inviter
		let inviterData = await getData("users", interaction.user.id);
		let inviterTournamentData = tournament.users?.[interaction.user.id];

		// In case the user is not in a team
		if (inviterTournamentData == null || inviterTournamentData.name == null) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You cannot invite a user if you do not own a team.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case registration is disabled
		if (!tournament.settings.allow_registration) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You cannot make changes to your team when registrations are closed.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the team size is 1
		if (tournament.rules.team_size == 1) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You cannot invite a user if the team size is 1.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		//	In case the use is already in your team
		if (inviterTournamentData.members.includes(invitee.id)) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You cannot invite a user that is already in your team.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the user hasn't linked their account
		if (inviteeData == null) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: User \`${invitee.tag}\` has not linked their account.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let dm = await invitee.createDM();
		let inviteAccept = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(
					"invite_accept?user=" +
						interaction.user.id +
						"&guild=" +
						interaction.guildId
				)
				.setLabel("Accept")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId(
					"invite_decline?user=" +
						interaction.user.id +
						"&guild=" +
						interaction.guildId
				)
				.setLabel("Decline")
				.setStyle("DANGER")
		);
		// Make an embed inviting the user to the team
		let teamString = "";
		for (let i = 0; i < inviterTournamentData.members.length; i++) {
			let member = inviterTournamentData.members[i];
			let memberData = await getData("users", member);
			teamString += `
			:flag_${memberData.osu.country_code.toLowerCase()}: ${
				memberData.osu.username
			} (#${memberData.osu.statistics.global_rank.toLocaleString()})`;
			if (i == 0) {
				teamString += " **(c)**";
			}
		}

		let embed = new MessageEmbed()
			.setTitle("Pending Invite!")
			.setDescription(
				stripIndents`
			You've received an invite to join a team from ${inviterData.osu.username}!

			${inviterData.osu.username} has invited you to join the team, **${inviterTournamentData.name}**!
			`
			)
			.setColor(tournament.settings.color || "#F88000")
			.setThumbnail("https://s.ppy.sh/a/" + inviterData.osu.id)
			.setAuthor({
				iconURL: "https://s.ppy.sh/a/" + inviterData.osu.id,
				name: inviterData.osu.username,
				url: "https://osu.ppy.sh/u/" + inviterData.osu.id,
			})
			.addField(`**${inviterTournamentData.name}:**`, teamString);

		dm.send({
			embeds: [embed],
			components: [inviteAccept],
		});

		embed = new MessageEmbed()
			.setTitle(`Invite sent to ${inviteeData.osu.username}!`)
			.setDescription("We'll send you a DM if they accept.")
			.setColor(tournament.settings.color || "#F88000")
			.setThumbnail("https://s.ppy.sh/a/" + inviteeData.osu.id);
		await interaction.editReply({ embeds: [embed] });
	},
};
