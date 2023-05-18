import {Client} from 'nodesu';
import {prisma} from "../lib/prisma";
import type {Map} from "@prisma/client"

const client = new Client(process.env.BANCHO_API_KEY);

export const fetchMap: (id: string) => Promise<Map> = async (id: string) => {
    let map = await prisma.map.findUnique({
      where: {
        beatmap_id: id,
      },
    });
    const sinceLastCache = (Date.now() - map?.fetch_time?.valueOf()) / 1000 / 60 / 60;
    if (map || sinceLastCache < 12) return map;
    const mapReq = (await client.beatmaps.getByBeatmapId(id))[0]

    map = {...mapReq};

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
}
