-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MapInPool" (
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "mapId" TEXT,
    "modPriority" INTEGER NOT NULL DEFAULT 0,
    "mappoolId" INTEGER NOT NULL,

    PRIMARY KEY ("identifier", "mappoolId"),
    CONSTRAINT "MapInPool_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("beatmap_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MapInPool" ("identifier", "mapId", "mappoolId", "modPriority", "mods") SELECT "identifier", "mapId", "mappoolId", "modPriority", "mods" FROM "MapInPool";
DROP TABLE "MapInPool";
ALTER TABLE "new_MapInPool" RENAME TO "MapInPool";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
