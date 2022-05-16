const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("make")
		.setDescription("Make a auto host rotate lobby")
		.addNumberOption((option) =>
			option
				.setName("min_stars")
				.setDescription("The minimum amount of stars a map must be")
				.setMinValue(0)
		)
		.addNumberOption((option) =>
			option
				.setName("max_stars")
				.setDescription("The maximum amount of stars a map must be")
				.setMinValue(0.001)
		)
		.addIntegerOption((option) =>
			option
				.setName("min_length")
				.setDescription("The minimum length of a map in seconds")
				.setMinValue(0)
		)
		.addIntegerOption((option) =>
			option
				.setName("max_length")
				.setDescription("The maximum length of a map in seconds")
				.setMinValue(1)
		),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		let options = interaction.options.data[0].options;

		console.log(options);
	},
};
