-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "round_id" INTEGER NOT NULL,
    "state" INTEGER NOT NULL,
    "teamInMatchTeam_id" INTEGER NOT NULL,
    "teamInMatchMatch_id" INTEGER NOT NULL,
    CONSTRAINT "Match_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Round" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamInMatch" (
    "team_id" INTEGER NOT NULL,
    "match_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "winner" BOOLEAN,

    PRIMARY KEY ("team_id", "match_id"),
    CONSTRAINT "TeamInMatch_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
