const { MessageButton, MessageEmbed } = require("discord.js");
const { prisma, fetchGuild } = require("../../prisma");

module.exports = {
	data: new MessageButton()
		.setCustomId("invite_accept")
		.setLabel("Accept")
		.setStyle("PRIMARY"),
	async execute(interaction, command) {
		let guild = await fetchGuild(command.options.guild);
		let tournament = guild.active_tournament;

		let userData = await prisma.user.findFirst({
			where: {
				discord_id: interaction.user.id,
			},
		});
		let team = await prisma.team.findFirst({
			where: {
				members: {
					some: {
						discordId: command.options.user,
					},
				},
				tournamentId: tournament.id,
			},
		});

		// tournament.users[interaction.user.id] = {
		// 	memberOf: command.options.user,
		// };
		await prisma.userInTeam.create({
			data: {
				teamId: team.id,
				discordId: interaction.user.id,
			},
		});

		let embed = new MessageEmbed()
			.setTitle("✅ Invite Accepted ✅")
			.setColor("GREEN");

		interaction.update({
			content: null,
			embeds: [embed],
			components: [],
		});

		let tourneyGuild = await interaction.client.guilds.fetch(
			command.options.guild
		);
		let tourneyMember = await tourneyGuild.members.fetch(
			command.options.user
		);

		let dm = await tourneyMember.createDM();
		let dmEmbed = new MessageEmbed()
			.setTitle("🎉 Your invite was accepted! 🎉")
			.setDescription(
				` \`${userData.osu_username}\` accepted your invite to join your team!`
			)
			.setColor(tournament.color)
			.setThumbnail(tournament.icon_url);
		await dm.send({ embeds: [dmEmbed] });
	},
};
