// Import Libraries
const { Match } = require("./osu/match");
const Banchojs = require("bancho.js");
const { TourneyBot } = require("./discord/bot");
require("dotenv").config();

let credentials = {
	username: process.env.banchoUsername,
	password: process.env.banchoPassword,
	apiKey: process.env.banchoAPIKey,
};

const client = new Banchojs.BanchoClient(credentials);

let matches = [];

client
	.connect()
	.then(async () => {
		client.on("PM", (msg) => {
			console.log(`${msg.user.ircUsername} >> ${msg.message}`);
			pmHandler(msg);
		});
	})
	.catch(console.error);

let discord = new TourneyBot();
/**
 * @param {Banchojs.PrivateMessage} msg
 */
async function pmHandler(msg) {
	if (msg.message.startsWith("!join")) {
		let command = msg.message.split(" ");

		let channelName = command[1];
		let mappoolName = command[2];

		try {
			let match = new Match(client, channelName, mappoolName);
			await match.initializeMatch();
			matches.push(match);
		} catch (e) {
			console.log(e);
			msg.user.sendMessage("We encountered an error: " + e);
		}
	}
}
