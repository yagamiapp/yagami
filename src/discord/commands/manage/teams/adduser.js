const { SlashCommandSubcommandBuilder } = require("discord.js");
const { EmbedBuilder, Colors } = require("discord.js");
const { fetchGuild, prisma } = require("../../../../lib/prisma");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("adduser")
		.setDescription("add a user to an existing team")
		.addUserOption((option) =>
			option
				.setName("user_in_team")
				.setDescription("A user in the team to add to")
				.setRequired(true)
		)
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("A user to add to the team")
				.setRequired(true)
		),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		let team = await prisma.team.findFirst({
			where: {
				Members: {
					some: {
						User: {
							DiscordAccounts: {
								some: {
									id: interaction.options.getUser(
										"user_in_team"
									).id,
								},
							},
						},
					},
				},
				tournamentId: tournament.id,
			},
		});

		if (!team) {
			let embed = new EmbedBuilder()
				.setDescription(`**Err**: That user is not in a team.`)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		await prisma.userInTeam.create({
			data: {
				teamId: team.id,
				discordId: interaction.options.getUser("user").id,
			},
		});

		let embed = new EmbedBuilder()
			.setTitle("Roster Changed")
			.setDescription(`**${team.name}**`)
			.setColor(team.color || "#F88000")
			.setThumbnail(team.icon_url);

		let members = await prisma.user.findMany({
			where: {
				InTeams: {
					some: {
						teamId: team.id,
					},
				},
			},
		});
		let teamString = "";
		for (let i = 0; i < members.length; i++) {
			let member = members[i];
			let rank = member.pp_rank;
			if (rank == null) {
				rank = "Unranked";
			} else {
				rank = `${rank.toLocaleString()}`;
			}

			teamString += `
			:flag_${member.country_code.toLowerCase()}: ${member.username} (#${rank})`;
			if (i == 0) {
				teamString += " **(c)**";
			}
		}
		embed.addFields({ name: "Roster", value: teamString });

		await interaction.editReply({
			content: null,
			embeds: [embed],
			components: [],
		});
	},
};
