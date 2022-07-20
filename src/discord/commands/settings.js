const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("settings")
		.setDescription("Edit global settings for the bot")
		.setDefaultMemberPermissions(0)
		.addBooleanOption((option) =>
			option
				.setName("change_nickname")
				.setDescription(
					"Change the nickname of users when they link their account, or when they join. Default: true"
				)
		)
		.addRoleOption((option) =>
			option
				.setName("linked_role")
				.setDescription("The role given to users with a linked account")
		)
		.addRoleOption((option) =>
			option
				.setName("player_role")
				.setDescription(
					"The role given to users when they are registered to the tournament"
				)
		)
		.addChannelOption((option) =>
			option
				.setName("match_results_channel")
				.setDescription(
					"The channel in which match messages will be posted"
				)
		),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let guild = await fetchGuild(interaction.guildId);
		let options = interaction.options.data;
		let description = "";

		for (let option of options) {
			guild[option.name] = option.value;
			description += `**${option.name}**: ${option.value}\n`;
		}
		guild.active_tournament = guild.active_tournament.id;
		delete guild.tournaments;
		await prisma.guild.update({
			where: {
				guild_id: interaction.guildId,
			},
			data: guild,
		});

		let embed = new EmbedBuilder()
			.setTitle("Settings Updated")
			.setDescription(description)
			.setColor("#AAAAAA");
		await interaction.editReply({ embeds: [embed] });
	},
};