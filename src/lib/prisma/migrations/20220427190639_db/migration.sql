/*
  Warnings:

  - The primary key for the `UserInTeam` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roundId" INTEGER NOT NULL,
    "starting_time" DATETIME NOT NULL,
    "state" INTEGER NOT NULL,
    "score_1" INTEGER NOT NULL,
    "score_2" INTEGER NOT NULL,
    "roll_winner" INTEGER NOT NULL,
    CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamInMatch" (
    "team_id" INTEGER NOT NULL,
    "match_id" INTEGER NOT NULL,

    PRIMARY KEY ("team_id", "match_id"),
    CONSTRAINT "TeamInMatch_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserInTeam" (
    "discord_id" TEXT NOT NULL,
    "team_id" INTEGER NOT NULL,
    "delete_warning" BOOLEAN,

    PRIMARY KEY ("discord_id", "team_id"),
    CONSTRAINT "UserInTeam_discord_id_fkey" FOREIGN KEY ("discord_id") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserInTeam_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserInTeam" ("delete_warning", "discord_id", "team_id") SELECT "delete_warning", "discord_id", "team_id" FROM "UserInTeam";
DROP TABLE "UserInTeam";
ALTER TABLE "new_UserInTeam" RENAME TO "UserInTeam";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
