const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { getCommand } = require("./createTeamCommandDeploy");
const fs = require("fs");
require("dotenv").config();
/**
 *
 * @param {number} guildId
 * @param {Array} commands
 */
module.exports.deployCommands = async (guildId) => {
	let commands = [];

	fs.readdirSync("./discord/commands")
		.filter((file) => file.endsWith(".js"))
		.forEach((file) => {
			let fileModule = require("./commands/" + file);
			if (!fileModule.dontPushByDefault) commands.push(fileModule.data);
		});

	commands.push(await getCommand(guildId));

	const rest = new REST({ version: "9" }).setToken(process.env.discordToken);

	rest
		.put(Routes.applicationGuildCommands(process.env.clientId, guildId), {
			body: commands,
		})
		.then(() =>
			console.log(
				"Registered command(s) to " +
					guildId +
					": " +
					commands.map((el) => {
						return el.name;
					})
			)
		)
		.catch(console.error);
};
