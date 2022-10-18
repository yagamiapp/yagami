/*
  Warnings:

  - You are about to drop the column `access_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `expires_in` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_update` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `access_token` on the `DiscordAccount` table. All the data in the column will be lost.
  - You are about to drop the column `expires_in` on the `DiscordAccount` table. All the data in the column will be lost.
  - You are about to drop the column `last_update` on the `DiscordAccount` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `DiscordAccount` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `DiscordAccount` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `DiscordAccount` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "OsuOauth" (
    "userId" INTEGER NOT NULL PRIMARY KEY,
    "last_update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_token" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL,
    CONSTRAINT "OsuOauth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "OsuOauth" ("userId", "last_update", "access_token", "expires_in", "refresh_token", "token_type") SELECT "id", "last_update", "access_token", "expires_in", "refresh_token", "type" FROM "User";

-- CreateTable
CREATE TABLE "DiscordOauth" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "last_update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_token" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    CONSTRAINT "DiscordOauth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "DiscordAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "DiscordOauth" ("userId", "last_update", "access_token", "expires_in", "refresh_token", "token_type", "scope") SELECT "id", "last_update", "access_token", "expires_in", "refresh_token", "type", "SCOPE" FROM "DiscordAccount";

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "country_name" TEXT NOT NULL,
    "cover_url" TEXT NOT NULL,
    "ranked_score" BIGINT NOT NULL,
    "play_count" INTEGER NOT NULL,
    "total_score" BIGINT NOT NULL,
    "pp_rank" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "level_progress" INTEGER NOT NULL,
    "hit_accuracy" REAL NOT NULL,
    "pp" REAL NOT NULL
);
INSERT INTO "new_User" ("country_code", "country_name", "cover_url", "hit_accuracy", "id", "level", "level_progress", "play_count", "pp", "pp_rank", "ranked_score", "total_score", "username") SELECT "country_code", "country_name", "cover_url", "hit_accuracy", "id", "level", "level_progress", "play_count", "pp", "pp_rank", "ranked_score", "total_score", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE TABLE "new_DiscordAccount" (
    "osuId" INTEGER NOT NULL,
    "id" TEXT NOT NULL PRIMARY KEY,
    "avatar" TEXT NOT NULL,
    "discriminator" TEXT NOT NULL,
    "flags" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    CONSTRAINT "DiscordAccount_osuId_fkey" FOREIGN KEY ("osuId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DiscordAccount" ("avatar", "discriminator", "flags", "id", "osuId", "username") SELECT "avatar", "discriminator", "flags", "id", "osuId", "username" FROM "DiscordAccount";
DROP TABLE "DiscordAccount";
ALTER TABLE "new_DiscordAccount" RENAME TO "DiscordAccount";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
