const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

// Subcommand Handler
let data = new SlashCommandBuilder()
	.setName("ahr")
	.setDescription("Set up auto-host-rotate lobbies");
let subcommands = {};

const subcommandFiles = fs
	.readdirSync("./discord/commands/ahr")
	.filter((file) => file.endsWith(".js"));

for (const file of subcommandFiles) {
	const subcommand = require(`./ahr/${file}`);
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
