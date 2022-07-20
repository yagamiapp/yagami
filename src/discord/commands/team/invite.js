const { stripIndents } = require("common-tags/lib");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const {
	EmbedBuilder,
	MessageActionRow,
	MessageButton,
	Colors,
} = require("discord.js");
const { fetchGuild, prisma } = require("../../../prisma");

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
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		// Get data of invitee
		let invitee = interaction.options.getUser("user");
		let inviteeData = await prisma.user.findFirst({
			where: {
				discord_id: invitee.id,
			},
		});
		let inviteeTeam = await prisma.team.findFirst({
			where: {
				Members: {
					some: {
						discordId: invitee.id,
					},
				},
				tournamentId: tournament.id,
			},
		});

		// Get data of inviter
		let inviterData = await prisma.user.findFirst({
			where: {
				discord_id: interaction.user.id,
			},
		});
		let inviterTeam = await prisma.team.findFirst({
			where: {
				Members: {
					some: {
						discordId: interaction.user.id,
					},
				},
				tournamentId: tournament.id,
			},
		});

		// In case the user is not in a team
		if (!inviterTeam) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: You cannot invite a user if you are not in a team.`
				)
				.setColor(Colors.Red)
				.setFooter({
					text: "You can create a team by using /team create",
				});
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let inviterMembers = await prisma.user.findMany({
			where: {
				InTeams: {
					some: {
						teamId: inviterTeam.id,
					},
				},
			},
		});

		// In case registration is disabled
		if (!tournament.allow_registrations) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: You cannot make changes to your team when registrations are closed.`
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the team size is 1
		if (tournament.team_size == 1) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: You cannot invite a user if the team size is 1.`
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		//	In case the use is already in your team
		let duplicateCheck = await prisma.user.findFirst({
			where: {
				discord_id: invitee.id,
				InTeams: {
					some: {
						discordId: invitee.id,
						teamId: inviterTeam.id,
					},
				},
			},
		});
		if (duplicateCheck) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: You cannot invite a user that is already in your team.`
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the user hasn't linked their account
		if (!inviteeData) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: User \`${invitee.tag}\` has not linked their account.`
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the team is full
		if (inviterMembers.length >= tournament.team_size) {
			let embed = new EmbedBuilder()
				.setDescription(`**Err**: Your team is full.`)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the user is already in a team
		if (inviteeTeam) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: User \`${inviteeData.osu_username}\` is already in a team.`
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		// If the team is in an active match
		let matchCheck = await prisma.match.findFirst({
			where: {
				Teams: {
					some: {
						teamId: inviterTeam.id,
					},
				},
				state: {
					gte: 0,
					lte: 7,
				},
			},
		});
		if (matchCheck) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: You cannot invite while your team is match.`
				)
				.setColor(Colors.Red);
			interaction.editReply({ embeds: [embed] });
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
		for (let i = 0; i < inviterMembers.length; i++) {
			let member = inviterMembers[i];
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

		let embed = new EmbedBuilder()
			.setTitle("Pending Invite!")
			.setDescription(
				stripIndents`
			You've received an invite to join a team from ${inviterData.osu_username}!

			${inviterData.osu_username} has invited you to join the team, **${inviterTeam.name}** in **${tournament.name}**!
			`
			)
			.setColor(inviterTeam.color || tournament.color || "#F88000")
			.setThumbnail(inviterTeam.icon_url)
			.setFooter({
				iconURL: tournament.icon_url,
				text: tournament.name,
			})
			.setAuthor({
				name: inviterData.osu_username,
				iconURL: "https://a.ppy.sh/" + inviterData.osu_id,
				url: "https://osu.ppy.sh/users/" + inviterData.osu_id,
			})
			.addFields({ name: `**${inviterTeam.name}:**`, value: teamString });

		dm.send({
			embeds: [embed],
			components: [inviteAccept],
		});

		embed = new EmbedBuilder()
			.setTitle(`Invite sent to ${inviteeData.osu_username}!`)
			.setDescription("We'll send you a DM if they accept.")
			.setColor(inviterTeam.color)
			.setThumbnail("https://s.ppy.sh/a/" + inviteeData.osu_id);
		await interaction.editReply({ embeds: [embed] });
	},
};
