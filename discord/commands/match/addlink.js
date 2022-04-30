const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const manager = require("../../../bancho/MatchManager");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("addlink")
		.setDescription("Quick test of message editing"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		try {
			manager.createMatch();
		} catch (e) {
			console.log(e);
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: We encountered an error while joining the match"
				)
				.setColor("RED")
				.setFooter({
					text: "Make sure the lobby exists, and that you added the bot as a ref",
				});
			await interaction.editReply({ embeds: [embed] });
		}
	},
};
