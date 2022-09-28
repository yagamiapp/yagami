const web = require("./src/web");
const discord = require("./src/discord");
const bancho = require("./src/bancho");
const { refreshTokens } = require("./src/lib/prisma");
require("dotenv").config();

if (!process.env.disableDiscord) {
	discord.init();
}
if (!process.env.disableBancho) {
	bancho.init();
}
refreshTokens();
