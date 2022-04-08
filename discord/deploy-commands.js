const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();
/**
 *
 * @param {number} guildId
 * @param {Array} commands
 */
module.exports.deployCommands = (guildId, commands) => {
	const rest = new REST({ version: "9" }).setToken(process.env.discordToken);

	rest.put(Routes.applicationGuildCommands(process.env.clientId, guildId), {
		body: commands,
	})
		.then(() =>
			console.log(
				"Successfully registered application command(s): " +
					commands.map((el) => {
						return el.name;
					})
			)
		)
		.catch(console.error);
};
