/*
  Warnings:

  - You are about to drop the column `bannedByMatch_id` on the `MapInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `bannedByTeam_id` on the `MapInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `picked` on the `MapInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `wonByTeam_id` on the `MapInMatch` table. All the data in the column will be lost.
  - The primary key for the `TeamInMatch` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `MapInPool` table. All the data in the column will be lost.
  - You are about to drop the column `roundId` on the `MapInPool` table. All the data in the column will be lost.
  - The primary key for the `Match` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `matchId` on table `TeamInMatch` required. This step will fail if there are existing NULL values in that column.
  - Made the column `roundId` on table `TeamInMatch` required. This step will fail if there are existing NULL values in that column.
  - Made the column `roundId` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MapInMatch" (
    "matchId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "mapIdentifier" TEXT NOT NULL,
    "poolId" INTEGER NOT NULL,
    "bannedByTeamId" INTEGER,
    "bannedByMatchId" INTEGER,
    "pickedByTeamId" INTEGER,
    "pickedByMatchId" INTEGER,
    "wonByTeamId" INTEGER,
    "wonByMatchId" INTEGER,

    PRIMARY KEY ("mapIdentifier", "matchId"),
    CONSTRAINT "MapInMatch_mapIdentifier_poolId_fkey" FOREIGN KEY ("mapIdentifier", "poolId") REFERENCES "MapInPool" ("identifier", "mappoolId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_matchId_roundId_fkey" FOREIGN KEY ("matchId", "roundId") REFERENCES "Match" ("id", "roundId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_bannedByMatchId_bannedByTeamId_fkey" FOREIGN KEY ("bannedByMatchId", "bannedByTeamId") REFERENCES "TeamInMatch" ("matchId", "teamId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_pickedByMatchId_pickedByTeamId_fkey" FOREIGN KEY ("pickedByMatchId", "pickedByTeamId") REFERENCES "TeamInMatch" ("matchId", "teamId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_wonByMatchId_wonByTeamId_fkey" FOREIGN KEY ("wonByMatchId", "wonByTeamId") REFERENCES "TeamInMatch" ("matchId", "teamId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MapInMatch" ("mapIdentifier", "matchId", "poolId", "roundId", "wonByMatchId") SELECT "mapIdentifier", "matchId", "poolId", "roundId", "wonByMatchId" FROM "MapInMatch";
DROP TABLE "MapInMatch";
ALTER TABLE "new_MapInMatch" RENAME TO "MapInMatch";
CREATE TABLE "new_TeamInMatch" (
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "roll" INTEGER,
    "pick_order" INTEGER,
    "ban_order" INTEGER,
    "winner" BOOLEAN,

    PRIMARY KEY ("teamId", "matchId"),
    CONSTRAINT "TeamInMatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_matchId_roundId_fkey" FOREIGN KEY ("matchId", "roundId") REFERENCES "Match" ("id", "roundId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TeamInMatch" ("ban_order", "matchId", "pick_order", "roll", "roundId", "score", "teamId", "winner") SELECT "ban_order", "matchId", "pick_order", "roll", "roundId", "score", "teamId", "winner" FROM "TeamInMatch";
DROP TABLE "TeamInMatch";
ALTER TABLE "new_TeamInMatch" RENAME TO "TeamInMatch";
CREATE TABLE "new_MapInPool" (
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "mappoolId" INTEGER NOT NULL,

    PRIMARY KEY ("identifier", "mappoolId"),
    CONSTRAINT "MapInPool_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("beatmap_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MapInPool" ("identifier", "mapId", "mappoolId", "mods") SELECT "identifier", "mapId", "mappoolId", "mods" FROM "MapInPool";
DROP TABLE "MapInPool";
ALTER TABLE "new_MapInPool" RENAME TO "MapInPool";
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL,
    "message_id" TEXT,
    "channel_id" TEXT,
    "mp_link" TEXT,
    "waiting_on" INTEGER,
    "roundId" INTEGER NOT NULL,
    "state" INTEGER NOT NULL,

    PRIMARY KEY ("id", "roundId"),
    CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("channel_id", "id", "message_id", "mp_link", "roundId", "state", "waiting_on") SELECT "channel_id", "id", "message_id", "mp_link", "roundId", "state", "waiting_on" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
