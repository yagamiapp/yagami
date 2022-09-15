/*
  Warnings:

  - You are about to drop the column `favorite_count` on the `Map` table. All the data in the column will be lost.
  - Added the required column `diff_speed` to the `Map` table without a default value. This is not possible if the table is not empty.
  - Added the required column `favourite_count` to the `Map` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Map" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "approved" TEXT NOT NULL,
    "approved_date" DATETIME NOT NULL,
    "artist" TEXT NOT NULL,
    "artist_unicode" TEXT NOT NULL,
    "audio_unavailable" TEXT NOT NULL,
    "beatmap_id" TEXT NOT NULL,
    "beatmapset_id" TEXT NOT NULL,
    "bpm" TEXT NOT NULL,
    "count_normal" TEXT NOT NULL,
    "count_slider" TEXT NOT NULL,
    "count_spinner" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "diff_aim" TEXT NOT NULL,
    "diff_speed" TEXT NOT NULL,
    "diff_approach" TEXT NOT NULL,
    "diff_drain" TEXT NOT NULL,
    "diff_overall" TEXT NOT NULL,
    "diff_size" TEXT NOT NULL,
    "difficultyrating" TEXT NOT NULL,
    "download_unavailable" TEXT NOT NULL,
    "favourite_count" TEXT NOT NULL,
    "file_md5" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,
    "hit_length" TEXT NOT NULL,
    "language_id" TEXT NOT NULL,
    "last_update" DATETIME NOT NULL,
    "max_combo" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "packs" TEXT NOT NULL,
    "passcount" TEXT NOT NULL,
    "playcount" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "storyboard" TEXT NOT NULL,
    "submit_date" DATETIME NOT NULL,
    "tags" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_unicode" TEXT NOT NULL,
    "total_length" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "video" TEXT NOT NULL,
    "roundId" INTEGER,
    "globalMappoolId" INTEGER,
    CONSTRAINT "Map_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Map_globalMappoolId_fkey" FOREIGN KEY ("globalMappoolId") REFERENCES "GlobalMappool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Map" ("approved", "approved_date", "artist", "artist_unicode", "audio_unavailable", "beatmap_id", "beatmapset_id", "bpm", "count_normal", "count_slider", "count_spinner", "creator", "creator_id", "diff_aim", "diff_approach", "diff_drain", "diff_overall", "diff_size", "difficultyrating", "download_unavailable", "file_md5", "genre_id", "globalMappoolId", "hit_length", "id", "identifier", "language_id", "last_update", "max_combo", "mode", "mods", "packs", "passcount", "playcount", "rating", "roundId", "source", "storyboard", "submit_date", "tags", "title", "title_unicode", "total_length", "version", "video") SELECT "approved", "approved_date", "artist", "artist_unicode", "audio_unavailable", "beatmap_id", "beatmapset_id", "bpm", "count_normal", "count_slider", "count_spinner", "creator", "creator_id", "diff_aim", "diff_approach", "diff_drain", "diff_overall", "diff_size", "difficultyrating", "download_unavailable", "file_md5", "genre_id", "globalMappoolId", "hit_length", "id", "identifier", "language_id", "last_update", "max_combo", "mode", "mods", "packs", "passcount", "playcount", "rating", "roundId", "source", "storyboard", "submit_date", "tags", "title", "title_unicode", "total_length", "version", "video" FROM "Map";
DROP TABLE "Map";
ALTER TABLE "new_Map" RENAME TO "Map";
CREATE UNIQUE INDEX "Map_identifier_key" ON "Map"("identifier");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
