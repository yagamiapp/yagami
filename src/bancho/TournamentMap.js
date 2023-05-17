let { prisma } = require('../lib/prisma');

/**
 * @prop {string} beatmap_id
 */
class TournamentMap {
  /**
   * @param {import("@prisma/client").Map}
   */
  constructor(map) {
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

  /**
   *
   * @param {import("@prisma/client").MapInPool} map
   */
  setMapInPool(map) {
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

module.exports.TournamentMap = TournamentMap;
