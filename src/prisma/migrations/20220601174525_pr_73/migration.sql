-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserInTeam" (
    "discordId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "member_order" INTEGER NOT NULL DEFAULT 0,
    "delete_warning" BOOLEAN,

    PRIMARY KEY ("discordId", "teamId"),
    CONSTRAINT "UserInTeam_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserInTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserInTeam" ("delete_warning", "discordId", "teamId") SELECT "delete_warning", "discordId", "teamId" FROM "UserInTeam";
DROP TABLE "UserInTeam";
ALTER TABLE "new_UserInTeam" RENAME TO "UserInTeam";
CREATE TABLE "new_TeamInMatch" (
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "roll" INTEGER,
    "pick_order" INTEGER,
    "ban_order" INTEGER,
    "aborts" INTEGER NOT NULL DEFAULT 0,
    "warmed_up" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN,

    PRIMARY KEY ("teamId", "matchId"),
    CONSTRAINT "TeamInMatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamInMatch" ("ban_order", "matchId", "pick_order", "roll", "score", "teamId", "warmed_up", "winner") SELECT "ban_order", "matchId", "pick_order", "roll", "score", "teamId", "warmed_up", "winner" FROM "TeamInMatch";
DROP TABLE "TeamInMatch";
ALTER TABLE "new_TeamInMatch" RENAME TO "TeamInMatch";
CREATE TABLE "new_Guild" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "change_nickname" BOOLEAN NOT NULL,
    "linked_role" TEXT,
    "player_role" TEXT,
    "match_results_channel" TEXT,
    "manager_admin_disabled" BOOLEAN NOT NULL DEFAULT false,
    "active_tournament" INTEGER
);
INSERT INTO "new_Guild" ("active_tournament", "change_nickname", "guild_id", "linked_role", "match_results_channel", "player_role") SELECT "active_tournament", "change_nickname", "guild_id", "linked_role", "match_results_channel", "player_role" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
