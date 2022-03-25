let firebase = require("../firebase");
let { Guild } = require("discord.js");
let template = require("../templates/guild.json");
let deploy = require("./deploy-commands");

/**
 *
 * @param { Guild } ev
 */
module.exports.onJoin = async (ev) => {
	if ((await firebase.getData("guilds", ev.id)) == null) {
		await firebase.setData(template, "guilds", ev.id);
	}
	deploy.deployCommands(ev.id);
};
