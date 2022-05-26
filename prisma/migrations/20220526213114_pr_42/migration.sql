/*
  Warnings:

  - You are about to drop the column `token_access_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `token_expires_in` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `token_refresh_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `token_type` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `warmedUp` on the `TeamInMatch` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mappool" ADD COLUMN "round_acronym" TEXT;
ALTER TABLE "Mappool" ADD COLUMN "round_name" TEXT;
ALTER TABLE "Mappool" ADD COLUMN "tournament_acronym" TEXT;
ALTER TABLE "Mappool" ADD COLUMN "tournament_iteration" TEXT;
ALTER TABLE "Mappool" ADD COLUMN "tournament_name" TEXT;

-- CreateTable
CREATE TABLE "Global" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ties" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "OsuOauth" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "access_token" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "OsuOauth_discord_id_fkey" FOREIGN KEY ("discord_id") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "OsuOauth" ("discord_id", "access_token", "expires_in", "refresh_token", "type") SELECT "discord_id", "token_access_token", "token_expires_in", "token_refresh_token", "token_type" FROM "User";

-- CreateTable
CREATE TABLE "DiscordOauth" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "access_token" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    CONSTRAINT "DiscordOauth_discord_id_fkey" FOREIGN KEY ("discord_id") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualifierRound" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mappoolId" INTEGER NOT NULL,
    CONSTRAINT "QualifierRound_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualifierMatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "map_index" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "TeamInQualifierMatch" (
    "teamId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,

    PRIMARY KEY ("teamId", "matchId"),
    CONSTRAINT "TeamInQualifierMatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamInQualifierMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "QualifierMatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL,
    "message_id" TEXT,
    "channel_id" TEXT,
    "mp_link" TEXT,
    "waiting_on" INTEGER,
    "roundId" INTEGER NOT NULL,
    "state" INTEGER NOT NULL,
    "scrim" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("id", "roundId"),
    CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("channel_id", "id", "message_id", "mp_link", "roundId", "state", "waiting_on") SELECT "channel_id", "id", "message_id", "mp_link", "roundId", "state", "waiting_on" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
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
    "osu_pp" REAL NOT NULL
);
INSERT INTO "new_User" ("discord_avatar", "discord_avatarURL", "discord_bot", "discord_createdTimestamp", "discord_defaultAvatarURL", "discord_discriminator", "discord_displayAvatarURL", "discord_flags", "discord_id", "discord_system", "discord_tag", "discord_username", "osu_country_code", "osu_country_name", "osu_cover_url", "osu_hit_accuracy", "osu_id", "osu_level", "osu_level_progress", "osu_play_count", "osu_pp", "osu_pp_rank", "osu_ranked_score", "osu_total_score", "osu_username") SELECT "discord_avatar", "discord_avatarURL", "discord_bot", "discord_createdTimestamp", "discord_defaultAvatarURL", "discord_discriminator", "discord_displayAvatarURL", "discord_flags", "discord_id", "discord_system", "discord_tag", "discord_username", "osu_country_code", "osu_country_name", "osu_cover_url", "osu_hit_accuracy", "osu_id", "osu_level", "osu_level_progress", "osu_play_count", "osu_pp", "osu_pp_rank", "osu_ranked_score", "osu_total_score", "osu_username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
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
    "allow_registrations" BOOLEAN NOT NULL,
    "Guild_id" TEXT,
    "delete_warning" BOOLEAN,
    "double_pick" INTEGER NOT NULL DEFAULT 1,
    "double_ban" INTEGER NOT NULL DEFAULT 1,
    "multiplier_nm" REAL NOT NULL DEFAULT 1.0,
    "multiplier_hd" REAL NOT NULL DEFAULT 1.0,
    "multiplier_hr" REAL NOT NULL DEFAULT 1.0,
    "multiplier_ez" REAL NOT NULL DEFAULT 1.5,
    "multiplier_fl" REAL NOT NULL DEFAULT 1.0,
    CONSTRAINT "Tournament_Guild_id_fkey" FOREIGN KEY ("Guild_id") REFERENCES "Guild" ("guild_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("Guild_id", "XvX_mode", "acronym", "allow_registrations", "color", "delete_warning", "double_ban", "double_pick", "force_nf", "icon_url", "id", "name", "score_mode", "team_mode", "team_size") SELECT "Guild_id", "XvX_mode", "acronym", "allow_registrations", "color", "delete_warning", "double_ban", "double_pick", "force_nf", "icon_url", "id", "name", "score_mode", "team_mode", "team_size" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "scrim" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("color", "icon_url", "id", "name", "tournamentId") SELECT "color", "icon_url", "id", "name", "tournamentId" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE TABLE "new_TeamInMatch" (
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "roll" INTEGER,
    "pick_order" INTEGER,
    "ban_order" INTEGER,
    "warmed_up" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN,

    PRIMARY KEY ("teamId", "matchId"),
    CONSTRAINT "TeamInMatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_matchId_roundId_fkey" FOREIGN KEY ("matchId", "roundId") REFERENCES "Match" ("id", "roundId") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "TeamInMatch" RENAME COLUMN "warmedUp" TO "warmed_up";
INSERT INTO "new_TeamInMatch" ("ban_order", "matchId", "pick_order", "roll", "roundId", "score", "teamId", "warmed_up", "winner") SELECT "ban_order", "matchId", "pick_order", "roll", "roundId", "score", "teamId", "warmed_up", "winner" FROM "TeamInMatch";
DROP TABLE "TeamInMatch";
ALTER TABLE "new_TeamInMatch" RENAME TO "TeamInMatch";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "QualifierRound_mappoolId_key" ON "QualifierRound"("mappoolId");
