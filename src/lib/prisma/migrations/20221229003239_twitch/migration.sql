-- CreateTable
CREATE TABLE "TwitchAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "requests_enabled" BOOLEAN NOT NULL DEFAULT false,
    "req_require_live" BOOLEAN NOT NULL DEFAULT false,
    "req_require_category" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "TwitchOauth" (
    "userId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "last_update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_token" TEXT NOT NULL,
    "expires_at" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_type" TEXT NOT NULL,
    CONSTRAINT "TwitchOauth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TwitchAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
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
    "twitchAccountId" INTEGER,
    CONSTRAINT "Tournament_Guild_id_fkey" FOREIGN KEY ("Guild_id") REFERENCES "Guild" ("guild_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tournament_twitchAccountId_fkey" FOREIGN KEY ("twitchAccountId") REFERENCES "TwitchAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("Guild_id", "acronym", "allow_registrations", "banner_url", "color", "delete_warning", "description", "double_ban", "double_pick", "fm_mods", "force_nf", "icon_url", "id", "name", "private", "score_mode", "team_mode", "team_size", "x_v_x_mode") SELECT "Guild_id", "acronym", "allow_registrations", "banner_url", "color", "delete_warning", "description", "double_ban", "double_pick", "fm_mods", "force_nf", "icon_url", "id", "name", "private", "score_mode", "team_mode", "team_size", "x_v_x_mode" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
