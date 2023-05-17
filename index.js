require("dotenv").config(); // Load ENV Vars

const discord = require("./src/discord");
const bancho = require("./src/bancho");
const twitch = require("./src/twitch");
const { refreshTokens } = require("./src/lib/prisma");

if (!process.env.disableDiscord) {
  discord.init();
}
if (!process.env.disableBancho) {
  bancho.init();
}
twitch.init();
refreshTokens();
