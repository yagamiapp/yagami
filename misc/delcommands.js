const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
require("dotenv").config();

let guildId = "611064433623695370";

const rest = new REST({ version: "9" }).setToken(process.env.discordToken);

rest
	.put(Routes.applicationGuildCommands(process.env.clientId, guildId), {
		body: [],
	})
	.then(() => console.log("Deleted command(s) in " + guildId))
	.catch(console.error);
