/*
  Warnings:

  - The primary key for the `AutoHostRotatePlayer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `AutoHostRotatePlayer` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutoHostRotatePlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "host" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AutoHostRotatePlayer_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "AutoHostRotate" ("discordId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AutoHostRotatePlayer" ("host", "id", "lobbyId", "rank", "username") SELECT "host", "id", "lobbyId", "rank", "username" FROM "AutoHostRotatePlayer";
DROP TABLE "AutoHostRotatePlayer";
ALTER TABLE "new_AutoHostRotatePlayer" RENAME TO "AutoHostRotatePlayer";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
