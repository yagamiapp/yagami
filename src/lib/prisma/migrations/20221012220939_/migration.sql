-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "osuId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device" TEXT,
    "browser" TEXT,
    CONSTRAINT "UserSession_osuId_fkey" FOREIGN KEY ("osuId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserSession" ("createdAt", "id", "osuId") SELECT "createdAt", "id", "osuId" FROM "UserSession";
DROP TABLE "UserSession";
ALTER TABLE "new_UserSession" RENAME TO "UserSession";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
