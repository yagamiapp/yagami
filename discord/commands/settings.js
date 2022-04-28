const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("settings")
		.setDescription("Edit global settings for the bot")
		.setDefaultPermission(true)
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
		.addBooleanOption((option) =>
			option
				.setName("update")
				.setDescription("Update guild commands and permissions")
		),
	async execute(interaction) {
		await interaction.deferReply();
		let guild = await fetchGuild(interaction.guildId);
		let options = interaction.options.data;
		let description = "";

		for (let option of options) {
			guild[option.name] = option.value;
			description += `**${option.name}**: ${option.value}\n`;
		}
		await prisma.guild.update({
			where: {
				guild_id: interaction.guildId,
			},
			data: guild,
		});

		let embed = new MessageEmbed()
			.setTitle("Settings Updated")
			.setDescription(description)
			.setColor("#AAAAAA");
		await interaction.editReply({ embeds: [embed] });
	},
};
