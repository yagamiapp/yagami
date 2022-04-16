const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("team")
		.setDescription("Manage your team through discord commands")
		.addSubcommand((command) =>
			command
				.setName("invite")
				.setDescription("Invite a user to your team")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("The user you want to invite")
						.setRequired(true)
				)
		),
	async execute(interaction) {
		let subcommand = interaction.options.getSubcommand();
		let file = require("./team/" + subcommand + ".js");
		await file.execute(interaction);
	},
	ephemeral: true,
	defer: true,
};
