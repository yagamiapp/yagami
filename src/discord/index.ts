import { Client, GatewayIntentBits } from 'discord.js';
import { commandHandler, fetchCommandFiles } from './commands';
import { Bot } from '../globals';
import env from '../lib/env';
import { prisma } from '../lib/prisma';
import { joinHandler } from './join';

export const bot: Bot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});

export const init = async () => {
  bot.commands = await fetchCommandFiles();
  await bot.login(env.discord.token);

  bot.once('ready', onReady);
  bot.on('interactionCreate', commandHandler);
  bot.on('guildCreate', joinHandler);
};

const onReady = async () => {
  console.log('Connected to Discord!');

  // Log current servers
  let guildString = '';
  const guilds = bot.guilds.cache;

  guilds.forEach((guild) => {
    guildString += `${guild.name}, `;
  });
  guildString = guildString.slice(0, -2); // Remove comma
  console.log(`Current Guilds: ${guildString}`);

  // Run join procedure on new servers if needed
  const servers = await prisma.guild.findMany({});

  const serverIds = servers.map((x) => x.guild_id);

  const unhandledGuilds = guilds.filter((x) => !serverIds.includes(x.id));

  for (const guild of unhandledGuilds) {
    joinHandler(guild[1]);
  }
};
