const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder, Colors } = require("discord.js");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("register")
		.setDescription("Make a new team and register to the tournament"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		if (!tournament.allow_registrations) {
			let embed = new EmbedBuilder()
				.setDescription("**Err**: Registrations are closed.")
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let duplicateCheck = await prisma.team.findFirst({
			where: {
				tournamentId: tournament.id,
				Members: {
					some: {
						discordId: interaction.user.id,
					},
				},
			},
		});

		if (duplicateCheck) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: You are already registered to the tournament!\n\nUse \`/deregister\` to deregister.`
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let user = await prisma.user.findFirst({
			where: {
				discord_id: interaction.user.id,
			},
		});

		// In case the user hasn't linked their account
		if (!user) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: You must link your account before you can register.`
				)
				.setFooter({ text: "You can link your account by using /link" })
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let team = {
			name: user.osu_username + "'s team",
			icon_url: "https://s.ppy.sh/a/" + user.osu_id,
			color: tournament.color || "#F88000",
			tournamentId: tournament.id,
		};

		if (tournament.team_size == 1) team.name = user.osu_username;

		let teamObject = await prisma.team.create({
			data: team,
		});

		await prisma.userInTeam.create({
			data: {
				discordId: interaction.user.id,
				teamId: teamObject.id,
			},
		});

		if (tournament.team_size == 1) {
			let embed = new EmbedBuilder()
				.setTitle("Registered")
				.setDescription(`You have been registered to the tournament!`)
				.setColor(team.color || "#F88000")
				.setThumbnail(team.icon_url);

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let embed = new EmbedBuilder()
			.setTitle("Registered")
			.setDescription(
				`You have been registered to the tournament!\n\nYou can change your team name and invite players with /team`
			)
			.setColor("#F88000")
			.setThumbnail(team.icon_url);

		await interaction.editReply({ embeds: [embed] });
	},
};
