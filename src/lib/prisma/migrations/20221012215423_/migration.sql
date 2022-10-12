-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MapInPool" (
    "identifier" TEXT NOT NULL,
    "mods" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "modPriority" INTEGER NOT NULL DEFAULT 0,
    "mappoolId" INTEGER NOT NULL,

    PRIMARY KEY ("identifier", "mappoolId"),
    CONSTRAINT "MapInPool_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("beatmap_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapInPool_mappoolId_fkey" FOREIGN KEY ("mappoolId") REFERENCES "Mappool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MapInPool" ("identifier", "mapId", "mappoolId", "modPriority", "mods") SELECT "identifier", "mapId", "mappoolId", "modPriority", "mods" FROM "MapInPool";
DROP TABLE "MapInPool";
ALTER TABLE "new_MapInPool" RENAME TO "MapInPool";
CREATE TABLE "new_UserInTeam" (
    "osuId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "member_order" INTEGER NOT NULL DEFAULT 0,
    "delete_warning" BOOLEAN,

    PRIMARY KEY ("osuId", "teamId"),
    CONSTRAINT "UserInTeam_osuId_fkey" FOREIGN KEY ("osuId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserInTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserInTeam" ("delete_warning", "member_order", "osuId", "teamId") SELECT "delete_warning", "member_order", "osuId", "teamId" FROM "UserInTeam";
DROP TABLE "UserInTeam";
ALTER TABLE "new_UserInTeam" RENAME TO "UserInTeam";
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "scrim" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("color", "icon_url", "id", "name", "scrim", "tournamentId") SELECT "color", "icon_url", "id", "name", "scrim", "tournamentId" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE TABLE "new_TeamInvite" (
    "inviteeUserId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,

    PRIMARY KEY ("inviteeUserId", "teamId"),
    CONSTRAINT "TeamInvite_inviteeUserId_fkey" FOREIGN KEY ("inviteeUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamInvite" ("inviteeUserId", "teamId") SELECT "inviteeUserId", "teamId" FROM "TeamInvite";
DROP TABLE "TeamInvite";
ALTER TABLE "new_TeamInvite" RENAME TO "TeamInvite";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
