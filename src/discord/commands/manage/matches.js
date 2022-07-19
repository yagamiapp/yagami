const { SlashCommandSubcommandGroupBuilder } = require("@discordjs/builders");
const fs = require("fs");

// Subcommand Handler
let data = new SlashCommandSubcommandGroupBuilder()
	.setName("matches")
	.setDescription("Create a matchup between two teams");
let subcommands = {};

const subcommandFiles = fs
	.readdirSync("./src/discord/commands/manage/matches")
	.filter((file) => file.endsWith(".js"));

for (const file of subcommandFiles) {
	const subcommand = require(`./matches/${file}`);
	data.addSubcommand(subcommand.data);
	subcommands[subcommand.data.name] = subcommand;
}

module.exports = {
	data,
	async execute(interaction) {
		let subcommand = interaction.options.getSubcommand();
		let file = subcommands[subcommand];
		await file.execute(interaction);
	},
};
