/*
  Warnings:

  - You are about to drop the column `guildGuild_id` on the `Tournament` table. All the data in the column will be lost.
  - You are about to alter the column `osu_pp` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - Added the required column `allow_registrations` to the `Tournament` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acronym" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "force_nf" BOOLEAN NOT NULL,
    "icon_url" TEXT NOT NULL,
    "score_mode" INTEGER NOT NULL,
    "team_mode" INTEGER NOT NULL,
    "team_size" INTEGER NOT NULL,
    "XvX_mode" INTEGER NOT NULL,
    "allow_registrations" BOOLEAN,
    "Guild_id" TEXT,
    CONSTRAINT "Tournament_Guild_id_fkey" FOREIGN KEY ("Guild_id") REFERENCES "Guild" ("guild_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("XvX_mode", "acronym", "color", "force_nf", "icon_url", "id", "name", "score_mode", "team_mode", "team_size") SELECT "XvX_mode", "acronym", "color", "force_nf", "icon_url", "id", "name", "score_mode", "team_mode", "team_size" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
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
    "osu_pp" REAL,
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
