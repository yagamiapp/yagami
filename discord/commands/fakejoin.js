const { SlashCommandBuilder } = require("@discordjs/builders");
const { onGuildJoin } = require("../join");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("fakejoin")
		.setDescription("Fake the bot joining the server"),
	async execute(interaction) {
		await onGuildJoin(interaction.guild);
		await interaction.reply("Fake join!");
	},
};
