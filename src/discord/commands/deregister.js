const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, Colors } = require("discord.js");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("deregister")
		.setDescription("Deregister from the tournament"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		let team = await prisma.team.findFirst({
			where: {
				Members: {
					some: {
						discordId: interaction.user.id,
					},
				},
			},
		});

		if (!tournament.allow_registrations) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: You cannot deregister while registrations are disabled.`
				)
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
		}

		if (!team) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: You cannot deregister unless you are in a team.`
				)
				.setColor(Colors.Red);
			interaction.editReply({ embeds: [embed] });
			return;
		}

		let matchCheck = await prisma.match.findFirst({
			where: {
				Teams: {
					some: {
						teamId: team.id,
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
					`**Err**: You cannot deregister while your team is match.`
				)
				.setColor(Colors.Red);
			interaction.editReply({ embeds: [embed] });
			return;
		}

		let members = await prisma.user.findMany({
			where: {
				InTeams: {
					some: {
						teamId: team.id,
					},
				},
			},
		});

		let userInTeam = await prisma.userInTeam.findFirst({
			where: {
				discordId: interaction.user.id,
			},
		});

		// In case the user's team has more than one member
		if (members.length > 1 && !userInTeam.delete_warning) {
			await prisma.userInTeam.update({
				where: {
					discordId_teamId: {
						discordId: interaction.user.id,
						teamId: team.id,
					},
				},
				data: {
					delete_warning: true,
				},
			});

			setTimeout(async () => {
				try {
					await prisma.userInTeam.update({
						where: {
							discordId: interaction.user.id,
						},
						data: {
							delete_warning: null,
						},
					});
				} catch (e) {}
			}, 30 * 1000);

			let embed = new EmbedBuilder()
				.setTitle("⚠ Warning ⚠")
				.setDescription(
					`You are about to leave your team. You will need an invite to join back. Type \`/deregister\` again to confirm.`
				)
				.setColor("DARK_RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}
		let teamMemberLength = await prisma.userInTeam.count({
			where: {
				teamId: team.id,
			},
		});

		await prisma.userInTeam.delete({
			where: {
				discordId_teamId: {
					discordId: interaction.user.id,
					teamId: team.id,
				},
			},
		});

		if (teamMemberLength <= 1) {
			await prisma.team.delete({
				where: {
					id: team.id,
				},
			});
		}

		let embed = new EmbedBuilder()
			.setTitle("See you next time!")
			.setDescription(`Successfully deregistered to the tournament!`)
			.setColor(tournament.color)
			.setThumbnail(
				tournament.icon_url ||
					"https://yagami.clxxiii.dev/static/yagami%20var.png"
			);

		await interaction.editReply({ embeds: [embed] });
		return;
	},
};
