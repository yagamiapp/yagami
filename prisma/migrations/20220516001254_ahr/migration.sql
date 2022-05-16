/*
  Warnings:

  - Added the required column `mp_link` to the `AutoHostRotate` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutoHostRotate" (
    "discordId" TEXT NOT NULL PRIMARY KEY,
    "mp_link" TEXT NOT NULL,
    "min_stars" INTEGER,
    "max_stars" INTEGER,
    "min_length" INTEGER,
    "max_length" INTEGER,
    "min_rank" INTEGER,
    "max_rank" INTEGER,
    CONSTRAINT "AutoHostRotate_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AutoHostRotate" ("discordId", "max_length", "max_rank", "max_stars", "min_length", "min_rank", "min_stars") SELECT "discordId", "max_length", "max_rank", "max_stars", "min_length", "min_rank", "min_stars" FROM "AutoHostRotate";
DROP TABLE "AutoHostRotate";
ALTER TABLE "new_AutoHostRotate" RENAME TO "AutoHostRotate";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
