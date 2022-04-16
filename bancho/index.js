const { BanchoClient } = require("bancho.js");
require("dotenv").config();
const { pmHandler } = require("./pmHandler");

module.exports.init = () => {
	let credentials = {
		username: process.env.banchoUsername,
		password: process.env.banchoPassword,
		apiKey: process.env.banchoAPIKey,
	};

	const client = new BanchoClient(credentials);

	client
		.connect()
		.then(async () => {
			client.on("PM", (msg) => {
				console.log(`${msg.user.ircUsername} >> ${msg.message}`);
				pmHandler(msg);
				module.exports.client = client;
			});
		})
		.catch(console.error);
};
