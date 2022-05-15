-- RedefineTables
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Round" ("acronym", "bans", "best_of", "delete_warning", "id", "mappoolId", "name", "show_mappool", "tournamentId") SELECT "acronym", "bans", "best_of", "delete_warning", "id", "mappoolId", "name", "show_mappool", "tournamentId" FROM "Round";
DROP TABLE "Round";
ALTER TABLE "new_Round" RENAME TO "Round";
CREATE UNIQUE INDEX "Round_mappoolId_key" ON "Round"("mappoolId");
CREATE TABLE "new_Mappool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "global" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Mappool" ("id") SELECT "id" FROM "Mappool";
DROP TABLE "Mappool";
ALTER TABLE "new_Mappool" RENAME TO "Mappool";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
