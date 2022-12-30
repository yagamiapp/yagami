/*
  Warnings:

  - You are about to alter the column `expires_at` on the `TwitchOauth` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TwitchOauth" (
    "userId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "last_update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_token" TEXT NOT NULL,
    "expires_at" BIGINT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL,
    CONSTRAINT "TwitchOauth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TwitchAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TwitchOauth" ("access_token", "expires_at", "last_update", "refresh_token", "token_type", "userId") SELECT "access_token", "expires_at", "last_update", "refresh_token", "token_type", "userId" FROM "TwitchOauth";
DROP TABLE "TwitchOauth";
ALTER TABLE "new_TwitchOauth" RENAME TO "TwitchOauth";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
