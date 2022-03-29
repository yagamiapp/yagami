let firebase = require("../firebase");
let { Guild } = require("discord.js");
let deploy = require("./deploy-commands");

/**
 * @desc Deploys commands to guild on join
 * @param { Guild } ev
 */
module.exports.onJoin = async (ev) => {
	deploy.deployCommands(ev.id);
};
