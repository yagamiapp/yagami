const web = require("./web");
const discord = require("./discord");
const bancho = require("./bancho");
require("dotenv").config();

if (!process.env.disableWeb) {
	web.init();
}
if (!process.env.disableDiscord) {
	// discord.init();
}
if (!process.env.disableBancho) {
	bancho.init();
}
