const { EmbedBuilder, Colors } = require("discord.js");
const { prisma, fetchGuild } = require("../../lib/prisma");

module.exports = {
	data: { customId: "invite_accept" },
	async execute(interaction, command) {
		let guild = await fetchGuild(command.options.guild);
		let tournament = guild.active_tournament;

		let userData = await prisma.user.findFirst({
			where: {
				DiscordAccounts: {
					some: {
						id: interaction.user.id,
					},
				},
			},
		});

		let invite = await prisma.teamInvite.findFirst({
			where: {
				inviteeUserId: userData.id,
				teamId: parseInt(command.options.team),
			},
		});

		if (!invite) {
			await interaction.message.edit({
				components: [],
				embeds: [],
				content: "You handled this invite already",
			});
			return;
		}

		let team = await prisma.team.findFirst({
			where: {
				id: invite.teamId,
				tournamentId: tournament.id,
			},
		});

		// tournament.users[interaction.user.id] = {
		// 	memberOf: command.options.user,
		// };
		await prisma.userInTeam.create({
			data: {
				teamId: team.id,
				osuId: userData.id,
			},
		});

		await prisma.teamInvite.delete({
			where: {
				inviteeUserId_teamId: {
					teamId: team.id,
					inviteeUserId: userData.id,
				},
			},
		});

		let embed = new EmbedBuilder()
			.setTitle("✅ Invite Accepted ✅")
			.setColor(Colors.Green);

		interaction.update({
			content: null,
			embeds: [embed],
			components: [],
		});
	},
};
