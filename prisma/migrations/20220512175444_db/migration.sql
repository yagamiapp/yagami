-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TeamInMatch" (
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "roll" INTEGER,
    "pick_order" INTEGER,
    "ban_order" INTEGER,
    "warmedUp" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN,

    PRIMARY KEY ("teamId", "matchId"),
    CONSTRAINT "TeamInMatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamInMatch_matchId_roundId_fkey" FOREIGN KEY ("matchId", "roundId") REFERENCES "Match" ("id", "roundId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamInMatch" ("ban_order", "matchId", "pick_order", "roll", "roundId", "score", "teamId", "winner") SELECT "ban_order", "matchId", "pick_order", "roll", "roundId", "score", "teamId", "winner" FROM "TeamInMatch";
DROP TABLE "TeamInMatch";
ALTER TABLE "new_TeamInMatch" RENAME TO "TeamInMatch";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
