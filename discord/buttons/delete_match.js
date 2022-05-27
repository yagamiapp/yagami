const { MessageButton, MessageEmbed } = require("discord.js");
const { prisma } = require("../../prisma");

module.exports = {
	data: new MessageButton()
		.setCustomId("delete_match")
		.setLabel("Delete Match")
		.setStyle("DANGER"),
	async execute(interaction, command) {
		if (!interaction.memberPermissions.has("ADMINISTRATOR")) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err:** You lack the permissions to perform this action"
				)
				.setColor("RED")
				.setFooter({
					text: "Please ping an admin to delete the match for you",
				});
			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
			return;
		}
	},
};
