const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { Match } = require("../../../bancho/Match");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("test")
		.setDescription("Quick test of message editing"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let match = new Match(1, "https://osu.ppy.sh/mp/100204924");
		try {
			await match.init();
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
