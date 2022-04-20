const { SlashCommandBuilder } = require("@discordjs/builders");
const { deployCommands } = require("../deploy-commands");
const { MessageEmbed } = require("discord.js");
const { getData, setData } = require("../../firebase");

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
		let guild = await getData("guilds", interaction.guildId);
		let options = interaction.options.data;
		let description = "";

		for (let option of options) {
			if (option.name === "update") {
				await deployCommands(interaction.guild);
				description += "Updated guild commands and permissions\n";
			} else {
				guild.settings[option.name] = option.value;
				await setData(
					option.value,
					"guilds",
					interaction.guildId,
					"settings",
					option.name
				);
				description += `**${option.name}**: ${option.value}\n`;
			}
		}

		let embed = new MessageEmbed()
			.setTitle("Settings Updated")
			.setDescription(description)
			.setColor("#AAAAAA");
		await interaction.editReply({ embeds: [embed] });
	},
	ephemeral: true,
	defer: true,
};
