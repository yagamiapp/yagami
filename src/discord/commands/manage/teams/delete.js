const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { fetchGuild, prisma } = require("../../../../prisma");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("delete")
		.setDescription("Remove a team")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("A user from the team")
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
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: Cannot edit teams while registrations are closed."
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let team = await prisma.team.findFirst({
			where: {
				tournamentId: tournament.id,
				Members: {
					some: {
						discordId: user.id,
					},
				},
			},
		});

		if (!team) {
			let embed = new MessageEmbed()
				.setDescription(`**Err**: That user is not in a team.`)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		await prisma.userInTeam.deleteMany({
			where: {
				teamId: team.id,
			},
		});

		await prisma.team.delete({
			where: {
				id: team.id,
			},
		});

		let embed = new MessageEmbed()
			.setTitle("Team deleted")
			.setDescription(`**${team.name}** has been deleted.`)
			.setColor(tournament.color)
			.setThumbnail(team.icon_url);

		await interaction.editReply({ embeds: [embed] });
		return;
	},
};
