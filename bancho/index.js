const { BanchoClient } = require("bancho.js");
const { prisma } = require("../prisma");
const { Match } = require("./Match");
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

			// Recover current matches
			let matches = await prisma.match.findMany({
				where: {
					OR: [
						{
							state: {
								not: 10,
							},
						},
						{
							state: {
								not: 9,
							},
						},
						{
							state: {
								not: 8,
							},
						},
						{
							state: {
								not: 3,
							},
						},
					],
				},
			});

			for (const match of matches) {
				let manager = new Match(match.id, match.mp_link);
				await manager.init();
			}
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
