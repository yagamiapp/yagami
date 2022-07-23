/*
  Warnings:

  - Added the required column `tournamentId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("color", "icon_url", "id", "name") SELECT "color", "icon_url", "id", "name" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
