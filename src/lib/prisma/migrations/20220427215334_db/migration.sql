/*
  Warnings:

  - You are about to drop the column `teamInMatchMatch_id` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `teamInMatchTeam_id` on the `Match` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "round_id" INTEGER NOT NULL,
    "state" INTEGER NOT NULL,
    CONSTRAINT "Match_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("id", "round_id", "state") SELECT "id", "round_id", "state" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
