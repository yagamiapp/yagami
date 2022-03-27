//@ts-check
const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction } = require("discord.js");
const crypto = require("crypto");
const firebase = require("./firebase");

(async (interaction) => {
	var id = crypto.randomBytes(5).toString("hex");
	{
		id: interaction.user;
	}
	console.log;
	firebase.setData();
})();
