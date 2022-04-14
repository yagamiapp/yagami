const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { setData, getData, pushData, updateUser } = require("../../firebase");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("deregister")
		.setDescription("Deregister from the tournament"),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		let active_tournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);

		let currentTournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		if (currentTournament?.teams?.[interaction.user.id] == null) {
			let embed = new MessageEmbed()
				.setTitle("Error")
				.setDescription(`You aren't registered, silly :P`)
				.setColor("RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}

		await setData(
			{},
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament,
			"teams",
			interaction.user.id
		);

		let embed = new MessageEmbed()
			.setTitle("See you next time!")
			.setDescription(`Successfully deregistered to the tournament!`)
			.setColor("#F88000")
			.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png");

		await interaction.editReply({ embeds: [embed] });
		return;
	},
	ephemeral: true,
	defer: true,
};
