const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, Colors } = require("discord.js");
const { prisma } = require("../../../prisma");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("A summary of your team, or someone elses")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Select a user to view the team of")
		),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let user = interaction.options.getUser("user") || interaction.user;

		let team = await prisma.team.findFirst({
			where: {
				Members: {
					some: {
						discordId: user.id,
					},
				},
			},
		});

		if (!team) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: ${
						interaction.options.getUser("user")
							? "That user is"
							: "You are"
					} not in a team`
				)
				.setColor(Colors.Red);
			interaction.editReply({ embeds: [embed] });
			return;
		}

		let embed = new EmbedBuilder()
			.setTitle(team.name)
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
		embed.addFields({ name: "Roster", value: teamString });

		await interaction.editReply({ embeds: [embed] });
	},
};
