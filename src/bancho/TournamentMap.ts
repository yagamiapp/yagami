import {prisma} from "../lib/prisma";
import type { Map, MapInPool } from "@prisma/client";

/**
 * @prop {string} beatmap_id
 */
class TournamentMap {
  beatmap_id: string;
  fetch_time: Date;
  approved: string;
  approved_date: Date ;
  artist: string ;
  artist_unicode: string ;
  audio_unavailable: string ;
  beatmapset_id: string ;
  bpm: string ;
  count_normal: string ;
  count_slider: string ;
  count_spinner: string ;
  creator: string ;
  creator_id: string ;
  diff_aim: string ;
  diff_speed: string ;
  diff_approach: string ;
  diff_drain: string ;
  diff_overall: string ;
  diff_size: string ;
  difficultyrating: string ;
  download_unavailable: string ;
  favourite_count: string ;
  file_md5: string ;
  genre_id: string ;
  hit_length: string ;
  language_id: string ;
  last_update: Date ;
  max_combo: string ;
  mode: string ;
  packs : string;
  passcount: string ;
  playcount: string ;
  rating: string ;
  source: string ;
  storyboard: string ;
  submit_date: Date ;
  tags: string ;
  title: string ;
  title_unicode: string ;
  total_length: string ;
  version: string ;
  video: string ;

  // Map InPool
  identifier: string;
  mods: string;
  mappoolId: number;

  constructor(map: Map) {
    this.beatmap_id = map.beatmap_id;
    this.fetch_time = map.fetch_time;
    this.approved = map.approved;
    this.approved_date = map.approved_date;
    this.artist = map.artist;
    this.artist_unicode = map.artist_unicode;
    this.audio_unavailable = map.audio_unavailable;
    this.beatmapset_id = map.beatmapset_id;
    this.bpm = map.bpm;
    this.count_normal = map.count_normal;
    this.count_slider = map.count_slider;
    this.count_spinner = map.count_spinner;
    this.creator = map.creator;
    this.creator_id = map.creator_id;
    this.diff_aim = map.diff_aim;
    this.diff_speed = map.diff_speed;
    this.diff_approach = map.diff_approach;
    this.diff_drain = map.diff_drain;
    this.diff_overall = map.diff_overall;
    this.diff_size = map.diff_size;
    this.difficultyrating = map.difficultyrating;
    this.download_unavailable = map.download_unavailable;
    this.favourite_count = map.favourite_count;
    this.file_md5 = map.file_md5;
    this.genre_id = map.genre_id;
    this.hit_length = map.hit_length;
    this.language_id = map.language_id;
    this.last_update = map.last_update;
    this.max_combo = map.max_combo;
    this.mode = map.mode;
    this.packs = map.packs;
    this.passcount = map.passcount;
    this.playcount = map.playcount;
    this.rating = map.rating;
    this.source = map.source;
    this.storyboard = map.storyboard;
    this.submit_date = map.submit_date;
    this.tags = map.tags;
    this.title = map.title;
    this.title_unicode = map.title_unicode;
    this.total_length = map.total_length;
    this.version = map.version;
    this.video = map.video;
  }

  setMapInPool(map: MapInPool) {
    this.identifier = map.identifier;
    this.mods = map.mods;
    this.mappoolId = map.mappoolId;
  }

  async getInPools() {
    return await prisma.mapInPool.findMany({
      where: {
        Mappool: {
          maps: {
            some: {
              mapId: this.beatmap_id,
            },
          },
        },
      },
    });
  }
}

export { TournamentMap }
