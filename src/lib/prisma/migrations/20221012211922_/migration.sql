-- CreateTable
CREATE TABLE "TeamInvite" (
    "inviteeUserId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,

    PRIMARY KEY ("inviteeUserId", "teamId"),
    CONSTRAINT "TeamInvite_inviteeUserId_fkey" FOREIGN KEY ("inviteeUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
