const { BanchoClient } = require("bancho.js");
const { pmHandler } = require("./pmHandler");

let credentials = {
  username: process.env.BANCHO_USERNAME,
  password: process.env.BANCHO_PASSWORD,
  apiKey: process.env.BANCHO_API_KEY,
  limiterTimespan: 12000,
};
const client = new BanchoClient(credentials);

module.exports = {
  client,
  async init() {
    await client.connect();
    console.log("Connected to Bancho!");

    client.on("PM", (msg) => {
      pmHandler(msg, this);
    });
  },
  /**
   *
   * @param {String} link A link to the match
   */
  fetchChannel(link) {
    let id = link.match(/\d*$/g);
    let channel = client.getChannel(`#mp_${id[0]}`);
    return channel;
  },
  async fetchUser(name) {
    return client.getUser(name);
  },
};
