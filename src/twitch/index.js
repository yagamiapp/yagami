const tmi = require("tmi.js");
const { prisma } = require("../lib/prisma");
const { osuLinkHandler } = require("./commands/osulink");
const { TWITCH_USERNAME, TWITCH_TOKEN } = process.env;

/**
 * @type tmi.Client
 */
let client;
/**
 * @type import("@prisma/client").TwitchAccount[]
 */
let channels;

module.exports = {
  init: async () => {
    channels = await prisma.twitchAccount.findMany();
    client = new tmi.client({
      identity: {
        username: TWITCH_USERNAME,
        password: TWITCH_TOKEN,
      },
    });

    client.connect();

    client.on("message", (channel, data, msg, self) => {
      if (self) {
        console.log("self");
        return;
      }

      // This is getting disabled eventually
      console.log(`${channel} >> ${data["display-name"]}: ${msg}`);

      let osuLinkRegex = /(https:\/\/osu\.ppy\.sh)|(https:\/\/lazer\.ppy\.sh)/g;

      if (msg.match(osuLinkRegex)) {
        osuLinkHandler(channel, data, msg, client);
      }
    });

    client.once("connected", async () => {
      console.log("Connected to Twitch!");

      // Until I implement settings, all twitch accounts will recieve map requests.
      let channelsToJoin = channels;
      // let channelsToJoin = channels.filter((x) => x.requests_enabled);
      for (const channel of channelsToJoin) {
        joinChannel(channel.username);
      }
    });
  },
  client,
  joinChannel,
};

function joinChannel(name) {
  console.log(`Joining ${name}'s twitch channel`);
  client.join(name);
}
