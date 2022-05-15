/*
  Warnings:

  - You are about to drop the `GlobalMappool` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `Map` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `globalMappoolId` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `identifier` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `roundId` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `teamInMatchMatch_id` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `teamInMatchTeam_id` on the `Map` table. All the data in the column will be lost.
  - Made the column `beatmap_id` on table `Map` required. This step will fail if there are existing NULL values in that column.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GlobalMappool";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "MapInPool" (
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "mappoolId" INTEGER NOT NULL,
    "teamInMatchTeam_id" INTEGER,
    "teamInMatchMatch_id" INTEGER,
    "matchId" INTEGER,

    PRIMARY KEY ("identifier", "mappoolId"),
    CONSTRAINT "MapInPool_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("beatmap_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_teamInMatchTeam_id_teamInMatchMatch_id_fkey" FOREIGN KEY ("teamInMatchTeam_id", "teamInMatchMatch_id") REFERENCES "TeamInMatch" ("team_id", "match_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mappool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Map" (
    "mods" TEXT,
    "approved" TEXT,
    "approved_date" DATETIME,
    "artist" TEXT,
    "artist_unicode" TEXT,
    "audio_unavailable" TEXT,
    "beatmap_id" TEXT NOT NULL PRIMARY KEY,
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
    "video" TEXT
);
INSERT INTO "new_Map" ("approved", "approved_date", "artist", "artist_unicode", "audio_unavailable", "beatmap_id", "beatmapset_id", "bpm", "count_normal", "count_slider", "count_spinner", "creator", "creator_id", "diff_aim", "diff_approach", "diff_drain", "diff_overall", "diff_size", "diff_speed", "difficultyrating", "download_unavailable", "favourite_count", "file_md5", "genre_id", "hit_length", "language_id", "last_update", "max_combo", "mode", "mods", "packs", "passcount", "playcount", "rating", "source", "storyboard", "submit_date", "tags", "title", "title_unicode", "total_length", "version", "video") SELECT "approved", "approved_date", "artist", "artist_unicode", "audio_unavailable", "beatmap_id", "beatmapset_id", "bpm", "count_normal", "count_slider", "count_spinner", "creator", "creator_id", "diff_aim", "diff_approach", "diff_drain", "diff_overall", "diff_size", "diff_speed", "difficultyrating", "download_unavailable", "favourite_count", "file_md5", "genre_id", "hit_length", "language_id", "last_update", "max_combo", "mode", "mods", "packs", "passcount", "playcount", "rating", "source", "storyboard", "submit_date", "tags", "title", "title_unicode", "total_length", "version", "video" FROM "Map";
DROP TABLE "Map";
ALTER TABLE "new_Map" RENAME TO "Map";
CREATE TABLE "new_Round" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acronym" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bans" INTEGER NOT NULL,
    "best_of" INTEGER NOT NULL,
    "delete_warning" TEXT,
    "show_mappool" BOOLEAN NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "mappoolId" INTEGER,
    CONSTRAINT "Round_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Round" ("acronym", "bans", "best_of", "delete_warning", "id", "name", "show_mappool", "tournamentId") SELECT "acronym", "bans", "best_of", "delete_warning", "id", "name", "show_mappool", "tournamentId" FROM "Round";
DROP TABLE "Round";
ALTER TABLE "new_Round" RENAME TO "Round";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
