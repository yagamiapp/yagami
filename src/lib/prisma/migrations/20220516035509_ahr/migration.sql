/*
  Warnings:

  - You are about to alter the column `max_stars` on the `AutoHostRotate` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `min_stars` on the `AutoHostRotate` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutoHostRotate" (
    "discordId" TEXT NOT NULL PRIMARY KEY,
    "mp_link" TEXT NOT NULL,
    "min_stars" REAL,
    "max_stars" REAL,
    "min_length" INTEGER,
    "max_length" INTEGER,
    "min_rank" INTEGER,
    "max_rank" INTEGER,
    "currentHostId" INTEGER,
    CONSTRAINT "AutoHostRotate_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AutoHostRotate_currentHostId_fkey" FOREIGN KEY ("currentHostId") REFERENCES "AutoHostRotatePlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AutoHostRotate" ("currentHostId", "discordId", "max_length", "max_rank", "max_stars", "min_length", "min_rank", "min_stars", "mp_link") SELECT "currentHostId", "discordId", "max_length", "max_rank", "max_stars", "min_length", "min_rank", "min_stars", "mp_link" FROM "AutoHostRotate";
DROP TABLE "AutoHostRotate";
ALTER TABLE "new_AutoHostRotate" RENAME TO "AutoHostRotate";
CREATE UNIQUE INDEX "AutoHostRotate_currentHostId_key" ON "AutoHostRotate"("currentHostId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
