let deploy = require("./deploy-commands");

module.exports.onJoin = async (ev) => {
	deploy.deployCommands(ev.id);
};
