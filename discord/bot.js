const { Client, Intents } = require("discord.js");
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

		client.once("ready", () => {});

		client.token(process.env.discordToken);
	}
}
