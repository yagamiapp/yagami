/*
  Warnings:

  - Added the required column `osuId` to the `TwitchAccount` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TwitchAccount" (
    "osuId" INTEGER NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "requests_enabled" BOOLEAN NOT NULL DEFAULT false,
    "req_require_live" BOOLEAN NOT NULL DEFAULT false,
    "req_require_category" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TwitchAccount_osuId_fkey" FOREIGN KEY ("osuId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TwitchAccount" ("id", "req_require_category", "req_require_live", "requests_enabled", "username") SELECT "id", "req_require_category", "req_require_live", "requests_enabled", "username" FROM "TwitchAccount";
DROP TABLE "TwitchAccount";
ALTER TABLE "new_TwitchAccount" RENAME TO "TwitchAccount";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
