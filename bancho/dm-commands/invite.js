const { prisma } = require("../../prisma");

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
		let username = msg.user.username;
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
									user: {
										osu_username: username,
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
		await channel.sendMessage(`!mp invite #${msg.user.id}`);

		// let matc = await msg.channel.sendMessage("Pong!");
	},
};
