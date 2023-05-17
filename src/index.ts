// Load ENV Vars
import * as dotenv from 'dotenv';
dotenv.config();

import { init as discordInit } from './discord';
import { init as banchoInit } from './bancho';
import { init as twitchInit } from './twitch';
import { refreshTokens } from './lib/prisma';

discordInit();
banchoInit();
twitchInit();
refreshTokens();
