const { MessageButton, MessageActionRow, MessageEmbed } = require("discord.js");
const { getData, setData } = require("../../firebase");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new MessageButton()
		.setCustomId("invite_accept")
		.setLabel("Accept")
		.setStyle("PRIMARY"),
	async execute(interaction, command) {
		let tournament = prisma.tournament.findFirst({
			where: {
				Guild_id: command.options.guild,
			},
		});

		let userData = await prisma.user.findFirst({
			where: {
				discord_id: interaction.user.id,
			},
		});
		let team = await prisma.team.findFirst({
			where: {
				members: {
					some: {
						discord_id: command.options.user,
					},
				},
			},
		});

		// tournament.users[interaction.user.id] = {
		// 	memberOf: command.options.user,
		// };
		await prisma.userInTeam.create({
			data: {
				team_id: team.id,
				discord_id: interaction.user.id,
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
