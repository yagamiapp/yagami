const fs = require("fs");

// let types = {
// 	0: "DM Message",
// 	1: "MP Message",
// };

// Create collection of commands
let commandFiles = fs
	.readdirSync("./bancho/commands")
	.filter((file) => file.endsWith(".js"));
let commands = {};
commandFiles.forEach((file) => {
	let command = require("./commands/" + file);
	commands[command.name] = command;
});

module.exports = {
	commands,
	async msgHandler(msg) {
		if (msg.self) return;
		/*
		 * Log message
		 */
		let messageType;
		// If DM
		if (!msg.channel) {
			messageType = 0;
			console.log(`[DM from ${msg.user.ircUsername}] >> ${msg.message}`);
		}

		if (msg.channel) {
			messageType = 1;
			console.log(
				`[${msg.channel.name}] ${msg.user.ircUsername} >> ${msg.message}`
			);
		}

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
				if (messageType == 0 && command.dm) {
					await command.exec(msg, options);
				}
				if (messageType == 1 && command.mp) {
					await command.exec(msg, options);
				}
			} catch (e) {
				console.log(e);
				msg.user.sendMessage("We encountered an error: " + e);
			}
		}
	},
};
