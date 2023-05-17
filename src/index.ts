// Load ENV Vars
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize modules
import('./discord').then((mod) => mod.init());
import('./bancho').then((mod) => mod.init());
import('./twitch').then((mod) => mod.init());

// Start refresh token loop
import('./lib/prisma').then((mod) => mod.refreshTokens());
