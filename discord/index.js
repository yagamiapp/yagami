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
		// Make Collection of commands
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

		// Make collection of buttons
		bot.buttons = new Collection();
		const buttonFiles = fs
			.readdirSync("./discord/buttons")
			.filter((file) => file.endsWith(".js"));

		for (const file of buttonFiles) {
			const button = require(`./buttons/${file}`);
			bot.buttons.set(button.data.customId, button);
		}

		// Command updating for testing purposes
		commandUpdate.deployCommands(process.env.testGuildId);

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
		// Button Handler
		bot.on("interactionCreate", async (interaction) => {
			if (!interaction.isButton()) return;
			// Restructure command id into command object
			let command = {};
			let stringParse = interaction.customId.split("?");
			command.name = stringParse[0];

			let options = {};
			stringParse[1]?.split("&").forEach((option) => {
				// Split into key value pairs
				option = option.split("=");
				options[option[0]] = option[1];
			});
			command.options = options;

			const button = bot.buttons.get(command.name);
			if (!button) return;

			try {
				await button.execute(interaction, command);
			} catch (error) {
				console.error(error);
				await interaction.reply({
					content: "There was an error while executing this button!",
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
