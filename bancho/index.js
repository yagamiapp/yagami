require("dotenv").config();
const { pmHandler } = require("./pmHandler");

module.exports.init = () => {
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
};
