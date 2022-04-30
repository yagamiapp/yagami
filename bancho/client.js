const { BanchoClient } = require("bancho.js");
require("dotenv").config();
const { msgHandler } = require("./msgHandler");

let credentials = {
	username: process.env.banchoUsername,
	password: process.env.banchoPassword,
	apiKey: process.env.banchoAPIKey,
};
const client = new BanchoClient(credentials);

module.exports = {
	client,
	init() {
		client.connect().then(async () => {
			console.log("Connected to Bancho!");

			client.on("PM", (msg) => {
				msgHandler(msg);
			});
		});
	},
	/**
	 *
	 * @param {String} link A link to the match
	 */
	fetchChannel(link) {
		let id = link.match(/\d*$/g);
		let channel = client.getChannel(`#mp_${id[0]}`);
		return channel;
	},
};
