/*
  Warnings:

  - You are about to drop the column `host` on the `AutoHostRotatePlayer` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutoHostRotatePlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "lobbyId" TEXT NOT NULL,
    CONSTRAINT "AutoHostRotatePlayer_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "AutoHostRotate" ("discordId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AutoHostRotatePlayer" ("id", "lobbyId", "rank", "username") SELECT "id", "lobbyId", "rank", "username" FROM "AutoHostRotatePlayer";
DROP TABLE "AutoHostRotatePlayer";
ALTER TABLE "new_AutoHostRotatePlayer" RENAME TO "AutoHostRotatePlayer";
CREATE TABLE "new_AutoHostRotate" (
    "discordId" TEXT NOT NULL PRIMARY KEY,
    "mp_link" TEXT NOT NULL,
    "min_stars" INTEGER,
    "max_stars" INTEGER,
    "min_length" INTEGER,
    "max_length" INTEGER,
    "min_rank" INTEGER,
    "max_rank" INTEGER,
    "currentHostId" INTEGER,
    CONSTRAINT "AutoHostRotate_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AutoHostRotate_currentHostId_fkey" FOREIGN KEY ("currentHostId") REFERENCES "AutoHostRotatePlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AutoHostRotate" ("discordId", "max_length", "max_rank", "max_stars", "min_length", "min_rank", "min_stars", "mp_link") SELECT "discordId", "max_length", "max_rank", "max_stars", "min_length", "min_rank", "min_stars", "mp_link" FROM "AutoHostRotate";
DROP TABLE "AutoHostRotate";
ALTER TABLE "new_AutoHostRotate" RENAME TO "AutoHostRotate";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
