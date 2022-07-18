const web = require("./src/web");
const discord = require("./src/discord");
const bancho = require("./src/bancho");
const { refreshTokens } = require("./src/prisma");
require("dotenv").config();

if (!process.env.disableWeb) {
	web.init();
}
if (!process.env.disableDiscord) {
	discord.init();
}
if (!process.env.disableBancho) {
	bancho.init();
}
refreshTokens();
