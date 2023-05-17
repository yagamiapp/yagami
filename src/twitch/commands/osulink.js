let { Client: nodesuClient } = require('nodesu');
let { client: osuClient } = require('../../bancho/client');
const { prisma } = require('../../lib/prisma');

let nodesu = new nodesuClient(process.env.BANCHO_API_KEY);

module.exports = {
  async osuLinkHandler(channel, data, msg, client) {
    let link = msg.match(/(https:\/\/osu.ppy.sh\/\S+)/g)[0];
    let linkDisection = link.split('/').filter((x) => x != '');

    if (linkDisection[2] == 'beatmapsets') await mapLink(client, channel, link, msg, data);
    if (linkDisection[2] == 'b') await mapLink(client, channel, link, msg, data);
  },
};

async function mapLink(client, channel, link, msg, data) {
  // Get streamer's osu information
  let user = data['display-name'];

  let streamer = await prisma.user.findFirst({
    where: {
      TwitchAccounts: {
        some: {
          id: parseInt(data['room-id']),
        },
      },
    },
  });
  // Get last number in the map link
  let mapId = link
    .split('/')
    .filter((x) => x != '')
    .reduce((prev, current) => (prev = current));

  let comment = msg.replace(link, '');

  let mapData = (await nodesu.beatmaps.getByBeatmapId(mapId))[0];

  let difficulty = Math.round(mapData.difficultyrating * 100) / 100;
  // Display length in minutes and seconds
  let time =
    Math.floor(mapData.total_length / 60) +
    (9 < mapData.total_length % 60 ? ':' : ':0') +
    (mapData.total_length % 60);

  // Assemble response strings
  let osuString = `${user} >> [https://osu.ppy.sh/b/${mapId} ${mapData.artist} - ${mapData.title} [${mapData.version}]] ${difficulty} ★ | ${mapData.bpm} BPM | Length: ${time} | ${mapData.max_combo}x | ${comment}`;

  let twitchString = `${mapData.artist} - ${mapData.title} [${mapData.version}] | ${difficulty} ★ | ${mapData.bpm} BPM | Length: ${time}`;

  await client.say(channel, twitchString);
  let osuStreamer = osuClient.getUser(streamer.username);
  await osuStreamer.fetchFromAPI();
  osuStreamer.sendMessage(osuString);
  console.log(osuStreamer);
}
