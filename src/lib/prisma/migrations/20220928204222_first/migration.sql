-- CreateTable
CREATE TABLE "Global" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ties" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "OsuBadge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "awarded_at" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "url" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserWithOsuBadge" (
    "userId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "badgeId"),
    CONSTRAINT "UserWithOsuBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserWithOsuBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "OsuBadge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomBadge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "awarded_at" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "url" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserWithCustomBadge" (
    "userId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "badgeId"),
    CONSTRAINT "UserWithCustomBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserWithCustomBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "CustomBadge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsersHostingTournament" (
    "userId" INTEGER NOT NULL,
    "tourney" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "tourney"),
    CONSTRAINT "UsersHostingTournament_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsersHostingTournament_tourney_fkey" FOREIGN KEY ("tourney") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
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
    "pp" REAL NOT NULL,
    "last_update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_token" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DiscordAccount" (
    "osuId" INTEGER NOT NULL,
    "id" TEXT NOT NULL PRIMARY KEY,
    "avatar" TEXT NOT NULL,
    "discriminator" TEXT NOT NULL,
    "flags" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "last_update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_token" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    CONSTRAINT "DiscordAccount_osuId_fkey" FOREIGN KEY ("osuId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "osuId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSession_osuId_fkey" FOREIGN KEY ("osuId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guild" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "change_nickname" BOOLEAN NOT NULL,
    "linked_role" TEXT,
    "player_role" TEXT,
    "match_results_channel" TEXT,
    "manager_admin_disabled" BOOLEAN NOT NULL DEFAULT false,
    "active_tournament" INTEGER
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acronym" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "banner_url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "force_nf" BOOLEAN NOT NULL,
    "icon_url" TEXT NOT NULL,
    "score_mode" INTEGER NOT NULL,
    "team_mode" INTEGER NOT NULL,
    "team_size" INTEGER NOT NULL,
    "x_v_x_mode" INTEGER NOT NULL,
    "allow_registrations" BOOLEAN NOT NULL,
    "Guild_id" TEXT,
    "delete_warning" BOOLEAN,
    "fm_mods" INTEGER NOT NULL DEFAULT 1,
    "double_pick" INTEGER NOT NULL DEFAULT 1,
    "double_ban" INTEGER NOT NULL DEFAULT 1,
    "private" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Tournament_Guild_id_fkey" FOREIGN KEY ("Guild_id") REFERENCES "Guild" ("guild_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModMultiplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournament_id" INTEGER NOT NULL,
    "modString" TEXT NOT NULL,
    "matchExactly" BOOLEAN NOT NULL DEFAULT false,
    "multiplier" REAL NOT NULL,
    CONSTRAINT "ModMultiplier_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Round" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acronym" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bans" INTEGER NOT NULL,
    "best_of" INTEGER NOT NULL,
    "delete_warning" TEXT,
    "show_mappool" BOOLEAN NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "mappoolId" INTEGER,
    CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Round_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mappool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "global" BOOLEAN NOT NULL DEFAULT false,
    "tournament_name" TEXT,
    "tournament_acronym" TEXT,
    "tournament_iteration" TEXT,
    "round_name" TEXT,
    "round_acronym" TEXT
);

-- CreateTable
CREATE TABLE "MapInPool" (
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "modPriority" INTEGER NOT NULL DEFAULT 0,
    "mappoolId" INTEGER NOT NULL,

    PRIMARY KEY ("identifier", "mappoolId"),
    CONSTRAINT "MapInPool_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("beatmap_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Map" (
    "beatmap_id" TEXT NOT NULL PRIMARY KEY,
    "fetch_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved" TEXT,
    "approved_date" DATETIME,
    "artist" TEXT,
    "artist_unicode" TEXT,
    "audio_unavailable" TEXT,
    "beatmapset_id" TEXT,
    "bpm" TEXT,
    "count_normal" TEXT,
    "count_slider" TEXT,
    "count_spinner" TEXT,
    "creator" TEXT,
    "creator_id" TEXT,
    "diff_aim" TEXT,
    "diff_speed" TEXT,
    "diff_approach" TEXT,
    "diff_drain" TEXT,
    "diff_overall" TEXT,
    "diff_size" TEXT,
    "difficultyrating" TEXT,
    "download_unavailable" TEXT,
    "favourite_count" TEXT,
    "file_md5" TEXT,
    "genre_id" TEXT,
    "hit_length" TEXT,
    "language_id" TEXT,
    "last_update" DATETIME,
    "max_combo" TEXT,
    "mode" TEXT,
    "packs" TEXT,
    "passcount" TEXT,
    "playcount" TEXT,
    "rating" TEXT,
    "source" TEXT,
    "storyboard" TEXT,
    "submit_date" DATETIME,
    "tags" TEXT,
    "title" TEXT,
    "title_unicode" TEXT,
    "total_length" TEXT,
    "version" TEXT,
    "video" TEXT
);

-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "scrim" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserInTeam" (
    "osuId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "member_order" INTEGER NOT NULL DEFAULT 0,
    "delete_warning" BOOLEAN,

    PRIMARY KEY ("osuId", "teamId"),
    CONSTRAINT "UserInTeam_osuId_fkey" FOREIGN KEY ("osuId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserInTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start_time" DATETIME,
    "message_id" TEXT,
    "channel_id" TEXT,
    "mp_link" TEXT,
    "waiting_on" INTEGER,
    "roundId" INTEGER,
    "state" INTEGER NOT NULL,
    "scrim" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrimSettings" (
    "matchId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bans" INTEGER NOT NULL,
    "best_of" INTEGER NOT NULL,
    CONSTRAINT "ScrimSettings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamInMatch" (
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "roll" INTEGER,
    "pick_order" INTEGER,
    "ban_order" INTEGER,
    "aborts" INTEGER NOT NULL DEFAULT 0,
    "faults" INTEGER NOT NULL DEFAULT 0,
    "warmed_up" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN,

    PRIMARY KEY ("teamId", "matchId"),
    CONSTRAINT "TeamInMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MapInMatch" (
    "matchId" INTEGER NOT NULL,
    "mapIdentifier" TEXT NOT NULL,
    "poolId" INTEGER NOT NULL,
    "bannedByTeamId" INTEGER,
    "bannedByMatchId" INTEGER,
    "pickedByTeamId" INTEGER,
    "pickedByMatchId" INTEGER,
    "pickNumber" INTEGER,
    "pickTeamNumber" INTEGER,
    "wonByTeamId" INTEGER,
    "wonByMatchId" INTEGER,

    PRIMARY KEY ("mapIdentifier", "matchId"),
    CONSTRAINT "MapInMatch_mapIdentifier_poolId_fkey" FOREIGN KEY ("mapIdentifier", "poolId") REFERENCES "MapInPool" ("identifier", "mappoolId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_bannedByMatchId_bannedByTeamId_fkey" FOREIGN KEY ("bannedByMatchId", "bannedByTeamId") REFERENCES "TeamInMatch" ("matchId", "teamId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_pickedByMatchId_pickedByTeamId_fkey" FOREIGN KEY ("pickedByMatchId", "pickedByTeamId") REFERENCES "TeamInMatch" ("matchId", "teamId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_wonByMatchId_wonByTeamId_fkey" FOREIGN KEY ("wonByMatchId", "wonByTeamId") REFERENCES "TeamInMatch" ("matchId", "teamId") ON DELETE SET NULL ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "AutoHostRotate" (
    "osuId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mp_link" TEXT NOT NULL,
    "min_stars" REAL,
    "max_stars" REAL,
    "min_length" INTEGER,
    "max_length" INTEGER,
    "min_rank" INTEGER,
    "max_rank" INTEGER,
    "currentHostId" INTEGER,
    CONSTRAINT "AutoHostRotate_osuId_fkey" FOREIGN KEY ("osuId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AutoHostRotate_currentHostId_fkey" FOREIGN KEY ("currentHostId") REFERENCES "AutoHostRotatePlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutoHostRotatePlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "lobbyId" INTEGER NOT NULL,
    CONSTRAINT "AutoHostRotatePlayer_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "AutoHostRotate" ("osuId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Round_mappoolId_key" ON "Round"("mappoolId");

-- CreateIndex
CREATE UNIQUE INDEX "QualifierRound_mappoolId_key" ON "QualifierRound"("mappoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AutoHostRotate_currentHostId_key" ON "AutoHostRotate"("currentHostId");
