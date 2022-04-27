/*
  Warnings:

  - You are about to drop the `UserInTeams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `user_id` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `User` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserInTeams";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "UserInTeam" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "team_id" INTEGER NOT NULL,
    CONSTRAINT "UserInTeam_discord_id_fkey" FOREIGN KEY ("discord_id") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserInTeam_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "color" TEXT NOT NULL
);
INSERT INTO "new_Team" ("color", "icon_url", "id", "name") SELECT "color", "icon_url", "id", "name" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE TABLE "new_User" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "discord_avatar" TEXT NOT NULL,
    "discord_avatarURL" TEXT NOT NULL,
    "discord_bot" BOOLEAN NOT NULL,
    "discord_createdTimestamp" INTEGER NOT NULL,
    "discord_defaultAvatarURL" TEXT NOT NULL,
    "discord_discriminator" TEXT NOT NULL,
    "discord_displayAvatarURL" TEXT NOT NULL,
    "discord_flags" INTEGER NOT NULL,
    "discord_system" BOOLEAN NOT NULL,
    "discord_tag" TEXT NOT NULL,
    "discord_username" TEXT NOT NULL,
    "osu_id" INTEGER NOT NULL,
    "osu_username" TEXT NOT NULL,
    "osu_country_code" TEXT NOT NULL,
    "osu_country_name" TEXT NOT NULL,
    "osu_cover_url" TEXT NOT NULL,
    "osu_ranked_score" INTEGER NOT NULL,
    "osu_play_count" INTEGER NOT NULL,
    "osu_total_score" INTEGER NOT NULL,
    "osu_pp_rank" INTEGER NOT NULL,
    "osu_level" INTEGER NOT NULL,
    "osu_level_progress" INTEGER NOT NULL,
    "osu_hit_accuracy" REAL NOT NULL,
    "osu_pp" REAL NOT NULL,
    "token_access_token" TEXT NOT NULL,
    "token_expires_in" INTEGER NOT NULL,
    "token_refresh_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL
);
INSERT INTO "new_User" ("discord_avatar", "discord_avatarURL", "discord_bot", "discord_createdTimestamp", "discord_defaultAvatarURL", "discord_discriminator", "discord_displayAvatarURL", "discord_flags", "discord_id", "discord_system", "discord_tag", "discord_username", "osu_country_code", "osu_country_name", "osu_cover_url", "osu_hit_accuracy", "osu_id", "osu_level", "osu_level_progress", "osu_play_count", "osu_pp", "osu_pp_rank", "osu_ranked_score", "osu_total_score", "osu_username", "token_access_token", "token_expires_in", "token_refresh_token", "token_type") SELECT "discord_avatar", "discord_avatarURL", "discord_bot", "discord_createdTimestamp", "discord_defaultAvatarURL", "discord_discriminator", "discord_displayAvatarURL", "discord_flags", "discord_id", "discord_system", "discord_tag", "discord_username", "osu_country_code", "osu_country_name", "osu_cover_url", "osu_hit_accuracy", "osu_id", "osu_level", "osu_level_progress", "osu_play_count", "osu_pp", "osu_pp_rank", "osu_ranked_score", "osu_total_score", "osu_username", "token_access_token", "token_expires_in", "token_refresh_token", "token_type" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
