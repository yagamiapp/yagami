const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("register")
		.setDescription("Make a new team and register to the tournament"),
	async execute(interaction) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		if (!tournament.allow_registrations) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: Registrations are closed.")
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let duplicateCheck = await prisma.team.findFirst({
			where: {
				tournamentId: tournament.id,
				members: {
					some: {
						discord_id: interaction.user.id,
					},
				},
			},
		});

		if (duplicateCheck) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You are already registered to the tournament!\n\nUse \`/deregister\` to deregister.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let user = await prisma.user.findFirst({
			where: {
				discord_id: interaction.user.id,
			},
		});

		let team = {
			name: user.osu_username + "'s team",
			icon_url: "https://s.ppy.sh/a/" + user.osu_id,
			color: "#F88000",
			tournamentId: tournament.id,
		};

		if (tournament.team_size == 1) team.name = user.osu_username;

		let teamObject = await prisma.team.create({
			data: team,
		});

		await prisma.userInTeam.create({
			data: {
				discord_id: interaction.user.id,
				team_id: teamObject.id,
			},
		});

		if (tournament.team_size == 1) {
			let embed = new MessageEmbed()
				.setTitle("Registered")
				.setDescription(`You have been registered to the tournament!`)
				.setColor("#F88000")
				.setThumbnail(team.icon_url);

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let embed = new MessageEmbed()
			.setTitle("Registered")
			.setDescription(
				`You have been registered to the tournament!\n\nYou can change your team name and invite players with /team`
			)
			.setColor("#F88000")
			.setThumbnail(team.icon_url);

		await interaction.editReply({ embeds: [embed] });
	},
	ephemeral: true,
	defer: true,
};
