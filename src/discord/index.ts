import { Client, GatewayIntentBits } from 'discord.js';
import { commandHandler, fetchCommandFiles } from './commands';
import { Bot } from '../globals';
import env from '../lib/env';

export const bot: Bot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});

export const init = async () => {
  bot.commands = await fetchCommandFiles();
  await bot.login(env.discord.token);

  bot.once('ready', onReady);
  bot.on('interactionCreate', commandHandler);
};

const onReady = () => {
  console.log('Connected to Discord!');

  // Log current servers
  let guildString = '';
  bot.guilds.cache.forEach((guild) => {
    guildString += `${guild.name}, `;
  });
  guildString = guildString.slice(0, -2);
  console.log(`Current Guilds: ${guildString}`);
};
