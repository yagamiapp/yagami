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
	async exec(msg, options) {
		let username = msg.user.username;

		let match = await msg.channel.sendMessage("Pong!");
	},
};
