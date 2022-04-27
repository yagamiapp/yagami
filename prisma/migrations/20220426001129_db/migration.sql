/*
  Warnings:

  - Added the required column `show_mappool` to the `Round` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Round" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acronym" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bans" INTEGER NOT NULL,
    "best_of" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "delete_warning" TEXT,
    "show_mappool" BOOLEAN NOT NULL,
    CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Round" ("acronym", "bans", "best_of", "delete_warning", "id", "name", "tournamentId") SELECT "acronym", "bans", "best_of", "delete_warning", "id", "name", "tournamentId" FROM "Round";
DROP TABLE "Round";
ALTER TABLE "new_Round" RENAME TO "Round";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
