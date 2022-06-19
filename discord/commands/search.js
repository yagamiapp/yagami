const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
let { MessageEmbed } = require("discord.js");
let { execute } = require("../buttons/search");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("search")
		.setDescription("Search through mappools and start scrims"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let mappools = await prisma.round.findMany({});

		// In case there are no rounds
		if (mappools == []) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: Somehow, there are no mappools available"
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		execute(interaction, { options: { i: 0 } });
	},
};
