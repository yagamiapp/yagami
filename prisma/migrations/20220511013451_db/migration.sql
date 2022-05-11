/*
  Warnings:

  - You are about to drop the column `bannedByMatch_id` on the `MapInPool` table. All the data in the column will be lost.
  - You are about to drop the column `bannedByTeam_id` on the `MapInPool` table. All the data in the column will be lost.
  - You are about to drop the column `pickedIn` on the `MapInPool` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "MapInMatch" (
    "matchId" INTEGER NOT NULL,
    "mapIdentifier" TEXT NOT NULL,
    "poolId" INTEGER NOT NULL,
    "bannedByTeam_id" INTEGER,
    "bannedByMatch_id" INTEGER,
    "picked" BOOLEAN NOT NULL DEFAULT false,
    "wonByTeam_id" INTEGER,
    "wonByMatchId" INTEGER,
    "teamInMatchTeam_id" INTEGER,
    "teamInMatchMatch_id" INTEGER,

    PRIMARY KEY ("mapIdentifier", "matchId"),
    CONSTRAINT "MapInMatch_mapIdentifier_poolId_fkey" FOREIGN KEY ("mapIdentifier", "poolId") REFERENCES "MapInPool" ("identifier", "mappoolId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_bannedByTeam_id_bannedByMatch_id_fkey" FOREIGN KEY ("bannedByTeam_id", "bannedByMatch_id") REFERENCES "TeamInMatch" ("team_id", "match_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_wonByTeam_id_wonByMatchId_fkey" FOREIGN KEY ("wonByTeam_id", "wonByMatchId") REFERENCES "TeamInMatch" ("team_id", "match_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_teamInMatchTeam_id_teamInMatchMatch_id_fkey" FOREIGN KEY ("teamInMatchTeam_id", "teamInMatchMatch_id") REFERENCES "TeamInMatch" ("team_id", "match_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MapInPool" (
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "mappoolId" INTEGER NOT NULL,
    "matchId" INTEGER,

    PRIMARY KEY ("identifier", "mappoolId"),
    CONSTRAINT "MapInPool_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("beatmap_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MapInPool" ("identifier", "mapId", "mappoolId", "mods") SELECT "identifier", "mapId", "mappoolId", "mods" FROM "MapInPool";
DROP TABLE "MapInPool";
ALTER TABLE "new_MapInPool" RENAME TO "MapInPool";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
