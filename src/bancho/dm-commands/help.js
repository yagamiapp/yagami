const fs = require("fs");

module.exports = {
	name: "help",
	desc: "Shows this menu",
	usage: "!help (command)",
	/**
	 * The execute function
	 * @param {import("bancho.js").BanchoMessage} msg The message object from the command
	 * @param {array} options The options given for the command
	 */
	async exec(msg, options) {
		let commandFiles = fs
			.readdirSync("./src/bancho/commands")
			.filter((file) => file.endsWith(".js"));
		let commands = {};
		commandFiles.forEach((file) => {
			let command = require("./" + file);
			commands[command.name] = command;
		});

		if (!msg.channel) {
			msg.user.sendMessage("Here are all available DM commands: ");
			for (let key in commands) {
				let command = commands[key];
				if (command.dm) {
					await msg.user.sendMessage(
						`• !${command.name} - ${command.desc}`
					);
				}
			}
		}

		if (msg.channel) {
			msg.user.sendMessage(
				"Here are all available Multiplayer commands: "
			);
			for (let key in commands) {
				let command = commands[key];
				if (command.mp) {
					await msg.channel.sendMessage(
						`!${command.name} - ${command.desc}`
					);
				}
			}
		}
	},
};
