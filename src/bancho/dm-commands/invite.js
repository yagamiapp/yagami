const { prisma } = require("../../lib/prisma");

module.exports = {
	name: "invite",
	desc: "Sends an invite to your lobby",
	usage: "!invite",
	/**
	 * The execute function
	 * @param {import("bancho.js").BanchoMessage} msg The message object from the command
	 * @param {array} options The options given for the command
	 * @param {import("../MatchManager").MatchManager}
	 */
	async exec(msg, options, client) {
		let id = (await msg.user.fetchFromAPI()).id;
		let match = await prisma.match.findFirst({
			where: {
				state: {
					gte: 0,
					lte: 7,
					not: 3,
				},

				Teams: {
					some: {
						Team: {
							Members: {
								some: {
									User: {
										osu_id: id,
									},
								},
							},
						},
					},
				},
			},
		});

		let channel = await client.fetchChannel(match.mp_link);
		await msg.user.sendMessage("Sending another invite:");
		await channel.sendMessage(`!mp invite #${id}`);

		// let matc = await msg.channel.sendMessage("Pong!");
	},
};
