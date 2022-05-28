/*
  Warnings:

  - The primary key for the `Match` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `roundId` on the `TeamInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `roundId` on the `MapInMatch` table. All the data in the column will be lost.
  - You are about to drop the column `XvX_mode` on the `Tournament` table. All the data in the column will be lost.
  - Added the required column `x_v_x_mode` to the `Tournament` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ScrimSettings" (
    "matchId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bans" INTEGER NOT NULL,
    "best_of" INTEGER NOT NULL,
    CONSTRAINT "ScrimSettings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
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
INSERT INTO "new_Match" ("channel_id", "id", "message_id", "mp_link", "roundId", "scrim", "state", "waiting_on") SELECT "channel_id", "id", "message_id", "mp_link", "roundId", "scrim", "state", "waiting_on" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE TABLE "new_TeamInMatch" (
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "roll" INTEGER,
    "pick_order" INTEGER,
    "ban_order" INTEGER,
    "warmed_up" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN,

    PRIMARY KEY ("teamId", "matchId"),
    CONSTRAINT "TeamInMatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamInMatch" ("ban_order", "matchId", "pick_order", "roll", "score", "teamId", "warmed_up", "winner") SELECT "ban_order", "matchId", "pick_order", "roll", "score", "teamId", "warmed_up", "winner" FROM "TeamInMatch";
DROP TABLE "TeamInMatch";
ALTER TABLE "new_TeamInMatch" RENAME TO "TeamInMatch";
CREATE TABLE "new_MapInMatch" (
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
INSERT INTO "new_MapInMatch" ("bannedByMatchId", "bannedByTeamId", "mapIdentifier", "matchId", "pickNumber", "pickTeamNumber", "pickedByMatchId", "pickedByTeamId", "poolId", "wonByMatchId", "wonByTeamId") SELECT "bannedByMatchId", "bannedByTeamId", "mapIdentifier", "matchId", "pickNumber", "pickTeamNumber", "pickedByMatchId", "pickedByTeamId", "poolId", "wonByMatchId", "wonByTeamId" FROM "MapInMatch";
DROP TABLE "MapInMatch";
ALTER TABLE "new_MapInMatch" RENAME TO "MapInMatch";
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
    "x_v_x_mode" INTEGER NOT NULL,
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
ALTER TABLE "Tournament" RENAME COLUMN "XvX_mode" TO "x_v_x_mode";
INSERT INTO "new_Tournament" ("Guild_id", "acronym", "allow_registrations", "color", "delete_warning", "double_ban", "double_pick", "force_nf", "icon_url", "id", "multiplier_ez", "multiplier_fl", "multiplier_hd", "multiplier_hr", "multiplier_nm", "name", "score_mode", "team_mode", "team_size", "x_v_x_mode") SELECT "Guild_id", "acronym", "allow_registrations", "color", "delete_warning", "double_ban", "double_pick", "force_nf", "icon_url", "id", "multiplier_ez", "multiplier_fl", "multiplier_hd", "multiplier_hr", "multiplier_nm", "name", "score_mode", "team_mode", "team_size", "x_v_x_mode" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
