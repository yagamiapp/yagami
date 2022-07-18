const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

// Subcommand Handler
let data = new SlashCommandBuilder()
	.setName("team")
	.setDescription("Manage your team as a captain");
let subcommands = {};

const subcommandFiles = fs
	.readdirSync("./discord/commands/team")
	.filter((file) => file.endsWith(".js"));

for (const file of subcommandFiles) {
	const subcommand = require(`./team/${file}`);
	data.addSubcommand(subcommand.data);
	subcommands[subcommand.data.name] = subcommand;
}

module.exports = {
	data,
	async execute(interaction) {
		let subcommand = interaction.options.getSubcommand();
		let command = subcommands[subcommand];
		await command.execute(interaction);
	},
};
