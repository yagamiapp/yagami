-- AlterTable
ALTER TABLE "TeamInMatch" ADD COLUMN "ban_order" INTEGER;
ALTER TABLE "TeamInMatch" ADD COLUMN "pick_order" INTEGER;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Map" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "identifier" TEXT,
    "mods" TEXT,
    "approved" TEXT,
    "approved_date" DATETIME,
    "artist" TEXT,
    "artist_unicode" TEXT,
    "audio_unavailable" TEXT,
    "beatmap_id" TEXT,
    "beatmapset_id" TEXT,
    "bpm" TEXT,
    "count_normal" TEXT,
    "count_slider" TEXT,
    "count_spinner" TEXT,
    "creator" TEXT,
    "creator_id" TEXT,
    "diff_aim" TEXT,
    "diff_speed" TEXT,
    "diff_approach" TEXT,
    "diff_drain" TEXT,
    "diff_overall" TEXT,
    "diff_size" TEXT,
    "difficultyrating" TEXT,
    "download_unavailable" TEXT,
    "favourite_count" TEXT,
    "file_md5" TEXT,
    "genre_id" TEXT,
    "hit_length" TEXT,
    "language_id" TEXT,
    "last_update" DATETIME,
    "max_combo" TEXT,
    "mode" TEXT,
    "packs" TEXT,
    "passcount" TEXT,
    "playcount" TEXT,
    "rating" TEXT,
    "source" TEXT,
    "storyboard" TEXT,
    "submit_date" DATETIME,
    "tags" TEXT,
    "title" TEXT,
    "title_unicode" TEXT,
    "total_length" TEXT,
    "version" TEXT,
    "video" TEXT,
    "roundId" INTEGER,
    "globalMappoolId" INTEGER,
    "matchId" INTEGER,
    CONSTRAINT "Map_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Map_globalMappoolId_fkey" FOREIGN KEY ("globalMappoolId") REFERENCES "GlobalMappool" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Map_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Map_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Map" ("approved", "approved_date", "artist", "artist_unicode", "audio_unavailable", "beatmap_id", "beatmapset_id", "bpm", "count_normal", "count_slider", "count_spinner", "creator", "creator_id", "diff_aim", "diff_approach", "diff_drain", "diff_overall", "diff_size", "diff_speed", "difficultyrating", "download_unavailable", "favourite_count", "file_md5", "genre_id", "globalMappoolId", "hit_length", "id", "identifier", "language_id", "last_update", "max_combo", "mode", "mods", "packs", "passcount", "playcount", "rating", "roundId", "source", "storyboard", "submit_date", "tags", "title", "title_unicode", "total_length", "version", "video") SELECT "approved", "approved_date", "artist", "artist_unicode", "audio_unavailable", "beatmap_id", "beatmapset_id", "bpm", "count_normal", "count_slider", "count_spinner", "creator", "creator_id", "diff_aim", "diff_approach", "diff_drain", "diff_overall", "diff_size", "diff_speed", "difficultyrating", "download_unavailable", "favourite_count", "file_md5", "genre_id", "globalMappoolId", "hit_length", "id", "identifier", "language_id", "last_update", "max_combo", "mode", "mods", "packs", "passcount", "playcount", "rating", "roundId", "source", "storyboard", "submit_date", "tags", "title", "title_unicode", "total_length", "version", "video" FROM "Map";
DROP TABLE "Map";
ALTER TABLE "new_Map" RENAME TO "Map";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
