const fs = require("fs");

// Create collection of commands
let commandFiles = fs
	.readdirSync("./bancho/dm-commands")
	.filter((file) => file.endsWith(".js"));
let commands = {};
commandFiles.forEach((file) => {
	let command = require("./dm-commands/" + file);
	if (command.mp) commands[command.name] = command;
});

module.exports = {
	commands,
	async pmHandler(msg) {
		if (msg.self) return;
		/*
		 * Log message
		 */
		console.log(`[DM from ${msg.user.ircUsername}] >> ${msg.message}`);

		/*
		 *	Command Handling
		 */
		let commandRegex = /^!\w+/g;
		/**
		 * @type {string}
		 */
		let message = msg.message;

		if (message.match(commandRegex)) {
			message = message.substring(1);
			let args = message.split(" ");

			if (args[0] == "!mp") return;
			let command = commands[args[0]];
			if (!command) return;
			let options = args.splice(1, 1);
			try {
				await command.exec(msg, options);
			} catch (e) {
				console.log(e);
				msg.user.sendMessage("We encountered an error: " + e);
			}
		}
	},
};
