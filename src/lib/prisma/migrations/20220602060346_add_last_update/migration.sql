-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OsuOauth" (
    "discord_id" TEXT NOT NULL PRIMARY KEY,
    "last_update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_token" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "OsuOauth_discord_id_fkey" FOREIGN KEY ("discord_id") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OsuOauth" ("access_token", "discord_id", "expires_in", "refresh_token", "type") SELECT "access_token", "discord_id", "expires_in", "refresh_token", "type" FROM "OsuOauth";
DROP TABLE "OsuOauth";
ALTER TABLE "new_OsuOauth" RENAME TO "OsuOauth";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
