-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UsersHostingTournament" (
    "userId" INTEGER NOT NULL,
    "tourney" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "tourney"),
    CONSTRAINT "UsersHostingTournament_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsersHostingTournament_tourney_fkey" FOREIGN KEY ("tourney") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UsersHostingTournament" ("tourney", "userId") SELECT "tourney", "userId" FROM "UsersHostingTournament";
DROP TABLE "UsersHostingTournament";
ALTER TABLE "new_UsersHostingTournament" RENAME TO "UsersHostingTournament";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
