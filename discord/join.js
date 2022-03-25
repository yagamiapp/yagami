let { FirebaseManager } = require("../firebase");
let { Guild } = require("discord.js");
let template = require("../templates/guild.json");

/**
 *
 * @param { Guild } ev
 */
module.exports.onJoin = async (ev) => {
	let firebase = new FirebaseManager();
	try {
		await firebase.getData("guilds", ev.id);
	} catch (e) {
		await firebase.setData(template, "guilds", ev.id);
	}
};
