const { Client, Intents } = require("discord.js");
const commandUpdate = require("./deploy-commands");
require("dotenv").config();

/**
 * @prop {Client} client The discord bot
 */
class TourneyBot {
	constructor() {
		/**
		 * @type {Client}
		 * @private
		 */
		const client = new Client({
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
		});

		client.commands = new Collection();
		const commandFiles = fs
			.readdirSync("./commands")
			.filter((file) => file.endsWith(".js"));

		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);
			// Set a new item in the Collection
			// With the key as the command name and the value as the exported module
			client.commands.set(command.data.name, command);
		}

		commandUpdate.deployCommands();

		client.once("ready", () => {
			console.log("Connected to Discord!");
		});

		client.token(process.env.discordToken);
	}
}
