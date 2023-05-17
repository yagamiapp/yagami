let nodesu = require('nodesu');
let { prisma } = require('../lib/prisma');

let client = new nodesu.Client(process.env.BANCHO_API_KEY);

/**
 *
 * @param {number} id
 * @returns {import("@prisma/client").Map}
 */
module.exports = {
  async fetchMap(id) {
    let map = await prisma.map.findUnique({
      where: {
        beatmap_id: id,
      },
    });
    let sinceLastCache = (Date.now() - map?.fetch_time) / 1000 / 60 / 60;
    if (map || sinceLastCache < 12) return map;
    map = await client.beatmaps.getByBeatmapId(id);
    map = map[0];

    map.approved_date = new Date(map?.approved_date);
    map.submit_date = new Date(map?.submit_date);
    map.last_update = new Date(map?.last_update);

    await prisma.map.upsert({
      create: map,
      update: map,
      where: {
        beatmap_id: map.beatmap_id,
      },
    });
    return map;
  },
};
