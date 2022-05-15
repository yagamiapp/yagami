/*
  Warnings:

  - The primary key for the `TeamInMatch` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `match_id` on the `TeamInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `team_id` on the `TeamInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `teamInMatchMatch_id` on the `MapInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `teamInMatchTeam_id` on the `MapInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `round_id` on the `Match` table. All the data in the column will be lost.
  - The primary key for the `UserInTeam` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discord_id` on the `UserInTeam` table. All the data in the column will be lost.
  - You are about to drop the column `team_id` on the `UserInTeam` table. All the data in the column will be lost.
  - Added the required column `id` to the `TeamInMatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `TeamInMatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roundId` to the `MapInPool` table without a default value. This is not possible if the table is not empty.
  - Made the column `matchId` on table `MapInPool` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `roundId` to the `MapInMatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discordId` to the `UserInTeam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `UserInTeam` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TeamInMatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "matchId" INTEGER,
    "roundId" INTEGER,
    "score" INTEGER NOT NULL,
    "roll" INTEGER,
    "pick_order" INTEGER,
    "ban_order" INTEGER,
    "winner" BOOLEAN,
    CONSTRAINT "TeamInMatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TeamInMatch" ("ban_order", "pick_order", "roll", "score", "winner") SELECT "ban_order", "pick_order", "roll", "score", "winner" FROM "TeamInMatch";
DROP TABLE "TeamInMatch";
ALTER TABLE "new_TeamInMatch" RENAME TO "TeamInMatch";
CREATE TABLE "new_MapInPool" (
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "mappoolId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,

    PRIMARY KEY ("identifier", "mappoolId"),
    CONSTRAINT "MapInPool_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("beatmap_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MapInPool" ("identifier", "mapId", "mappoolId", "matchId", "mods") SELECT "identifier", "mapId", "mappoolId", "matchId", "mods" FROM "MapInPool";
DROP TABLE "MapInPool";
ALTER TABLE "new_MapInPool" RENAME TO "MapInPool";
CREATE TABLE "new_MapInMatch" (
    "matchId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "mapIdentifier" TEXT NOT NULL,
    "poolId" INTEGER NOT NULL,
    "bannedByTeam_id" INTEGER,
    "bannedByMatch_id" INTEGER,
    "picked" BOOLEAN NOT NULL DEFAULT false,
    "wonByTeam_id" INTEGER,
    "wonByMatchId" INTEGER,

    PRIMARY KEY ("mapIdentifier", "matchId"),
    CONSTRAINT "MapInMatch_mapIdentifier_poolId_fkey" FOREIGN KEY ("mapIdentifier", "poolId") REFERENCES "MapInPool" ("identifier", "mappoolId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_bannedByTeam_id_fkey" FOREIGN KEY ("bannedByTeam_id") REFERENCES "TeamInMatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_wonByTeam_id_fkey" FOREIGN KEY ("wonByTeam_id") REFERENCES "TeamInMatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MapInMatch" ("bannedByMatch_id", "bannedByTeam_id", "mapIdentifier", "matchId", "picked", "poolId", "wonByMatchId", "wonByTeam_id") SELECT "bannedByMatch_id", "bannedByTeam_id", "mapIdentifier", "matchId", "picked", "poolId", "wonByMatchId", "wonByTeam_id" FROM "MapInMatch";
DROP TABLE "MapInMatch";
ALTER TABLE "new_MapInMatch" RENAME TO "MapInMatch";
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message_id" TEXT,
    "channel_id" TEXT,
    "mp_link" TEXT,
    "waiting_on" INTEGER,
    "roundId" INTEGER,
    "state" INTEGER NOT NULL,
    CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("channel_id", "id", "message_id", "mp_link", "state", "waiting_on") SELECT "channel_id", "id", "message_id", "mp_link", "state", "waiting_on" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE TABLE "new_UserInTeam" (
    "discordId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "delete_warning" BOOLEAN,

    PRIMARY KEY ("discordId", "teamId"),
    CONSTRAINT "UserInTeam_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserInTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserInTeam" ("delete_warning") SELECT "delete_warning" FROM "UserInTeam";
DROP TABLE "UserInTeam";
ALTER TABLE "new_UserInTeam" RENAME TO "UserInTeam";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
