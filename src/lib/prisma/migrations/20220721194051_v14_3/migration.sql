/*
  Warnings:

  - You are about to alter the column `osu_total_score` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "discord_avatar" TEXT NOT NULL,
    "discord_avatarURL" TEXT NOT NULL,
    "discord_bot" BOOLEAN NOT NULL,
    "discord_createdTimestamp" BIGINT NOT NULL,
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
    "osu_ranked_score" BIGINT NOT NULL,
    "osu_play_count" INTEGER NOT NULL,
    "osu_total_score" BIGINT NOT NULL,
    "osu_pp_rank" INTEGER NOT NULL,
    "osu_level" INTEGER NOT NULL,
    "osu_level_progress" INTEGER NOT NULL,
    "osu_hit_accuracy" REAL NOT NULL,
    "osu_pp" REAL NOT NULL
);
INSERT INTO "new_User" ("discord_avatar", "discord_avatarURL", "discord_bot", "discord_createdTimestamp", "discord_defaultAvatarURL", "discord_discriminator", "discord_displayAvatarURL", "discord_flags", "discord_id", "discord_system", "discord_tag", "discord_username", "osu_country_code", "osu_country_name", "osu_cover_url", "osu_hit_accuracy", "osu_id", "osu_level", "osu_level_progress", "osu_play_count", "osu_pp", "osu_pp_rank", "osu_ranked_score", "osu_total_score", "osu_username") SELECT "discord_avatar", "discord_avatarURL", "discord_bot", "discord_createdTimestamp", "discord_defaultAvatarURL", "discord_discriminator", "discord_displayAvatarURL", "discord_flags", "discord_id", "discord_system", "discord_tag", "discord_username", "osu_country_code", "osu_country_name", "osu_cover_url", "osu_hit_accuracy", "osu_id", "osu_level", "osu_level_progress", "osu_play_count", "osu_pp", "osu_pp_rank", "osu_ranked_score", "osu_total_score", "osu_username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
