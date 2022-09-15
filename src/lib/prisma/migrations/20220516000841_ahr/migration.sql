-- CreateTable
CREATE TABLE "AutoHostRotate" (
    "discordId" TEXT NOT NULL PRIMARY KEY,
    "min_stars" INTEGER,
    "max_stars" INTEGER,
    "min_length" INTEGER,
    "max_length" INTEGER,
    "min_rank" INTEGER,
    "max_rank" INTEGER,
    CONSTRAINT "AutoHostRotate_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutoHostRotatePlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "host" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AutoHostRotatePlayer_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "AutoHostRotate" ("discordId") ON DELETE RESTRICT ON UPDATE CASCADE
);
