const { Client, Intents, Collection } = require("discord.js");
const commandUpdate = require("./deploy-commands");
const fs = require("fs");
const join = require("./join");
require("dotenv").config();

const bot = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
});

module.exports = {
	init() {
		bot.commands = new Collection();
		const commandFiles = fs
			.readdirSync("./discord/commands")
			.filter((file) => file.endsWith(".js"));

		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);
			// Set a new item in the Collection
			// With the key as the command name and the value as the exported module
			bot.commands.set(command.data.name, command);
		}

		// Command updating for testing purposes
		const slashCommands = [];

		fs.readdirSync("./discord/commands")
			.filter((file) => file.endsWith(".js"))
			.forEach((file) => {
				let fileModule = require("./commands/" + file);
				slashCommands.push(fileModule.data);
			});
		commandUpdate.deployCommands(process.env.testGuildId, slashCommands);

		// Command Handler
		bot.on("interactionCreate", async (interaction) => {
			if (!interaction.isCommand()) return;

			const command = bot.commands.get(interaction.commandName);

			if (!command) return;

			try {
				if (command.defer) {
					await interaction.deferReply({
						ephemeral: command.ephemeral,
					});
				}
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				await interaction.editReply({
					content: "There was an error while executing this command!",
					ephemeral: true,
				});
			}
		});

		// Setup server on join
		bot.on("guildCreate", (ev) => {
			join.onJoin(ev);
		});

		bot.once("ready", () => {
			console.log("Connected to Discord!");
		});

		bot.login(process.env.discordToken);
	},
	getBot() {
		return bot;
	},
};
