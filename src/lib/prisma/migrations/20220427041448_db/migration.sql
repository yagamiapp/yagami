/*
  Warnings:

  - You are about to drop the column `delete_warning` on the `Team` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserInTeam" ADD COLUMN "delete_warning" BOOLEAN;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guild" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "change_nickname" BOOLEAN NOT NULL,
    "linked_role" TEXT,
    "player_role" TEXT,
    "active_tournament" INTEGER
);
INSERT INTO "new_Guild" ("active_tournament", "change_nickname", "guild_id", "linked_role", "player_role") SELECT "active_tournament", "change_nickname", "guild_id", "linked_role", "player_role" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("color", "icon_url", "id", "name", "tournamentId") SELECT "color", "icon_url", "id", "name", "tournamentId" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
