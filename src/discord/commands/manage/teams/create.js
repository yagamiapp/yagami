const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, Colors } = require("discord.js");
const { fetchGuild, prisma } = require("../../../../prisma");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Make a new team")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("A user to add to the team")
				.setRequired(true)
		),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 * @returns
	 */
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let user = interaction.options.getUser("user");
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		if (!tournament.allow_registrations) {
			let embed = new EmbedBuilder()
				.setDescription(
					"**Err**: Cannot edit teams while registrations are closed."
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let duplicateCheck = await prisma.team.findFirst({
			where: {
				tournamentId: tournament.id,
				Members: {
					some: {
						discordId: user.id,
					},
				},
			},
		});

		if (duplicateCheck) {
			let embed = new EmbedBuilder()
				.setDescription(`**Err**: That user is already in a team.`)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let dbUser = await prisma.user.findFirst({
			where: {
				discord_id: user.id,
			},
		});

		// In case the user hasn't linked their account
		if (!dbUser) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: \`${user.tag}\` has not linked their account.`
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let team = {
			name: dbUser.osu_username + "'s team",
			icon_url: "https://s.ppy.sh/a/" + dbUser.osu_id,
			color: tournament.color || "#F88000",
			tournamentId: tournament.id,
		};

		if (tournament.team_size == 1) team.name = dbUser.osu_username;

		let teamObject = await prisma.team.create({
			data: team,
		});

		await prisma.userInTeam.create({
			data: {
				discordId: user.id,
				teamId: teamObject.id,
			},
		});

		let embed = new EmbedBuilder()
			.setTitle("Team created")
			.setDescription(`**${team.name}** has been created.`)
			.setColor(tournament.color)
			.setThumbnail(team.icon_url);

		await interaction.editReply({ embeds: [embed] });
		return;
	},
};
