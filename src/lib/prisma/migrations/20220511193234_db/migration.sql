-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MapInMatch" (
    "matchId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "mapIdentifier" TEXT NOT NULL,
    "poolId" INTEGER NOT NULL,
    "bannedByTeamId" INTEGER,
    "bannedByMatchId" INTEGER,
    "pickedByTeamId" INTEGER,
    "pickedByMatchId" INTEGER,
    "wonByTeamId" INTEGER,
    "wonByMatchId" INTEGER,

    PRIMARY KEY ("mapIdentifier", "matchId"),
    CONSTRAINT "MapInMatch_mapIdentifier_poolId_fkey" FOREIGN KEY ("mapIdentifier", "poolId") REFERENCES "MapInPool" ("identifier", "mappoolId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_matchId_roundId_fkey" FOREIGN KEY ("matchId", "roundId") REFERENCES "Match" ("id", "roundId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_bannedByMatchId_bannedByTeamId_fkey" FOREIGN KEY ("bannedByMatchId", "bannedByTeamId") REFERENCES "TeamInMatch" ("matchId", "teamId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_pickedByMatchId_pickedByTeamId_fkey" FOREIGN KEY ("pickedByMatchId", "pickedByTeamId") REFERENCES "TeamInMatch" ("matchId", "teamId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MapInMatch_wonByMatchId_wonByTeamId_fkey" FOREIGN KEY ("wonByMatchId", "wonByTeamId") REFERENCES "TeamInMatch" ("matchId", "teamId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MapInMatch" ("bannedByMatchId", "bannedByTeamId", "mapIdentifier", "matchId", "pickedByMatchId", "pickedByTeamId", "poolId", "roundId", "wonByMatchId", "wonByTeamId") SELECT "bannedByMatchId", "bannedByTeamId", "mapIdentifier", "matchId", "pickedByMatchId", "pickedByTeamId", "poolId", "roundId", "wonByMatchId", "wonByTeamId" FROM "MapInMatch";
DROP TABLE "MapInMatch";
ALTER TABLE "new_MapInMatch" RENAME TO "MapInMatch";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
