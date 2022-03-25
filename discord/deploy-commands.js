const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
require("dotenv").config();
/**
 *
 * @param {number} guildId
 */
module.exports.deployCommands = (guildId) => {
	const commands = [];

	fs.readdirSync("./discord/commands")
		.filter((file) => file.endsWith(".js"))
		.forEach((file) => {
			let fileModule = require("./commands/" + file);
			commands.push(fileModule.data);
		});

	const rest = new REST({ version: "9" }).setToken(process.env.discordToken);

	rest
		.put(Routes.applicationGuildCommands(process.env.clientId, guildId), {
			body: commands,
		})
		.then(() => console.log("Successfully registered application commands."))
		.catch(console.error);
};
