-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acronym" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "force_nf" BOOLEAN NOT NULL,
    "icon_url" TEXT NOT NULL,
    "score_mode" INTEGER NOT NULL,
    "team_mode" INTEGER NOT NULL,
    "team_size" INTEGER NOT NULL,
    "x_v_x_mode" INTEGER NOT NULL,
    "allow_registrations" BOOLEAN NOT NULL,
    "Guild_id" TEXT,
    "delete_warning" BOOLEAN,
    "fm_mods" INTEGER NOT NULL DEFAULT 1,
    "double_pick" INTEGER NOT NULL DEFAULT 1,
    "double_ban" INTEGER NOT NULL DEFAULT 1,
    "multiplier_nm" REAL NOT NULL DEFAULT 1.0,
    "multiplier_hd" REAL NOT NULL DEFAULT 1.0,
    "multiplier_hr" REAL NOT NULL DEFAULT 1.0,
    "multiplier_ez" REAL NOT NULL DEFAULT 1.5,
    "multiplier_fl" REAL NOT NULL DEFAULT 1.0,
    CONSTRAINT "Tournament_Guild_id_fkey" FOREIGN KEY ("Guild_id") REFERENCES "Guild" ("guild_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("Guild_id", "acronym", "allow_registrations", "color", "delete_warning", "double_ban", "double_pick", "force_nf", "icon_url", "id", "multiplier_ez", "multiplier_fl", "multiplier_hd", "multiplier_hr", "multiplier_nm", "name", "score_mode", "team_mode", "team_size", "x_v_x_mode") SELECT "Guild_id", "acronym", "allow_registrations", "color", "delete_warning", "double_ban", "double_pick", "force_nf", "icon_url", "id", "multiplier_ez", "multiplier_fl", "multiplier_hd", "multiplier_hr", "multiplier_nm", "name", "score_mode", "team_mode", "team_size", "x_v_x_mode" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
