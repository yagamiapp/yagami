-- CreateTable
CREATE TABLE "Map" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "approved" TEXT NOT NULL,
    "approved_date" DATETIME NOT NULL,
    "artist" TEXT NOT NULL,
    "artist_unicode" TEXT NOT NULL,
    "audio_unavailable" INTEGER NOT NULL,
    "beatmap_id" TEXT NOT NULL,
    "beatmapset_id" TEXT NOT NULL,
    "bpm" INTEGER NOT NULL,
    "count_normal" INTEGER NOT NULL,
    "count_slider" INTEGER NOT NULL,
    "count_spinner" INTEGER NOT NULL,
    "creator" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "diff_aim" INTEGER NOT NULL,
    "diff_approach" INTEGER NOT NULL,
    "diff_drain" INTEGER NOT NULL,
    "diff_overall" INTEGER NOT NULL,
    "diff_size" INTEGER NOT NULL,
    "difficultyrating" REAL NOT NULL,
    "download_unavailable" INTEGER NOT NULL,
    "favorite_count" INTEGER NOT NULL,
    "file_md5" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,
    "hit_length" INTEGER NOT NULL,
    "language_id" INTEGER NOT NULL,
    "last_update" DATETIME NOT NULL,
    "max_combo" INTEGER NOT NULL,
    "mode" INTEGER NOT NULL,
    "packs" TEXT NOT NULL,
    "passcount" INTEGER NOT NULL,
    "playcount" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "storyboard" INTEGER NOT NULL,
    "submit_date" DATETIME NOT NULL,
    "tags" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_unicode" TEXT NOT NULL,
    "total_length" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "video" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "globalMappoolId" INTEGER,
    CONSTRAINT "Map_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Map_globalMappoolId_fkey" FOREIGN KEY ("globalMappoolId") REFERENCES "GlobalMappool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Round" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acronym" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bans" INTEGER NOT NULL,
    "best_of" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tournament" (
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
    "guildGuild_id" TEXT,
    CONSTRAINT "Tournament_guildGuild_id_fkey" FOREIGN KEY ("guildGuild_id") REFERENCES "Guild" ("guild_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
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
    "osu_pp" INTEGER NOT NULL,
    "token_access_token" TEXT NOT NULL,
    "token_expires_in" INTEGER NOT NULL,
    "token_refresh_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GlobalMappool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Guild" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "change_nickname" BOOLEAN NOT NULL,
    "linked_role" TEXT NOT NULL,
    "player_role" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Map_identifier_key" ON "Map"("identifier");
