-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutoHostRotatePlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "lobbyId" TEXT NOT NULL,
    CONSTRAINT "AutoHostRotatePlayer_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "AutoHostRotate" ("discordId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AutoHostRotatePlayer" ("id", "lobbyId", "rank", "username") SELECT "id", "lobbyId", "rank", "username" FROM "AutoHostRotatePlayer";
DROP TABLE "AutoHostRotatePlayer";
ALTER TABLE "new_AutoHostRotatePlayer" RENAME TO "AutoHostRotatePlayer";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
