/*
  Warnings:

  - You are about to drop the column `bannedIn` on the `MapInPool` table. All the data in the column will be lost.
  - You are about to drop the column `pickedByMatch_id` on the `MapInPool` table. All the data in the column will be lost.
  - You are about to drop the column `pickedByTeam_id` on the `MapInPool` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MapInPool" (
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "mappoolId" INTEGER NOT NULL,
    "bannedByTeam_id" INTEGER,
    "bannedByMatch_id" INTEGER,
    "pickedIn" INTEGER,

    PRIMARY KEY ("identifier", "mappoolId"),
    CONSTRAINT "MapInPool_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("beatmap_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_pickedIn_fkey" FOREIGN KEY ("pickedIn") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_bannedByTeam_id_bannedByMatch_id_fkey" FOREIGN KEY ("bannedByTeam_id", "bannedByMatch_id") REFERENCES "TeamInMatch" ("team_id", "match_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MapInPool" ("identifier", "mapId", "mappoolId", "mods") SELECT "identifier", "mapId", "mappoolId", "mods" FROM "MapInPool";
DROP TABLE "MapInPool";
ALTER TABLE "new_MapInPool" RENAME TO "MapInPool";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
