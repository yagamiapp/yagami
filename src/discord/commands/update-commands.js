const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { deployCommands } = require("../deploy-commands");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("updatecommands")
		.setDescription("Updates guild permissions and commands")
		.setDefaultMemberPermissions(0),
	async execute(interaction) {
		await interaction.deferReply();
		await deployCommands(interaction.guild);

		let embed = new EmbedBuilder()
			.setColor("#BBBBBB")
			.setDescription("Updated guild commands and permissions");
		await interaction.editReply({ embeds: [embed] });
	},
};
