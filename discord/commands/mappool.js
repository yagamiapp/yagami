const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageEmbed } = require("discord.js");
const options = require("../../settings.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("mappool")
		.setDescription("Lists maps in a given mappool")
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription("Required to identify the pool")
				.setRequired(true)
		),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		let id = interaction.options.getString("id");

		let mappool = options.rounds.filter((obj) => obj.acronym == id);

		if (mappool.length == 0) {
			await interaction.editReply({
				content: `No Mappool with name that found.`,
			});
		} else {
			let embed = new MessageEmbed()
				.setColor("#0EB8B9")
				.setTitle(mappool[0].name)
				.setDescription("This is a pool");
			await interaction.editReply({ embeds: [embed] });
		}
	},
};
