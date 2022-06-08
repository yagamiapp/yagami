-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MapInPool" (
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "modPriority" INTEGER NOT NULL DEFAULT 0,
    "mappoolId" INTEGER NOT NULL,

    PRIMARY KEY ("identifier", "mappoolId"),
    CONSTRAINT "MapInPool_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("beatmap_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MapInPool" ("identifier", "mapId", "mappoolId", "mods") SELECT "identifier", "mapId", "mappoolId", "mods" FROM "MapInPool";
DROP TABLE "MapInPool";
ALTER TABLE "new_MapInPool" RENAME TO "MapInPool";
CREATE TABLE "new_TeamInMatch" (
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "roll" INTEGER,
    "pick_order" INTEGER,
    "ban_order" INTEGER,
    "aborts" INTEGER NOT NULL DEFAULT 0,
    "faults" INTEGER NOT NULL DEFAULT 0,
    "warmed_up" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN,

    PRIMARY KEY ("teamId", "matchId"),
    CONSTRAINT "TeamInMatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamInMatch" ("aborts", "ban_order", "matchId", "pick_order", "roll", "score", "teamId", "warmed_up", "winner") SELECT "aborts", "ban_order", "matchId", "pick_order", "roll", "score", "teamId", "warmed_up", "winner" FROM "TeamInMatch";
DROP TABLE "TeamInMatch";
ALTER TABLE "new_TeamInMatch" RENAME TO "TeamInMatch";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
