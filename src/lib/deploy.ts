import { Guild, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';

export const deployCommands = async (guild: Guild) => {
  const guildCommands = [];

  const files = readdirSync('./src/discord/commands')
    .filter((file) => file.endsWith('.ts'))
    .filter((file) => file != 'index.ts');

  for (const file of files) {
    const fileModule = await import('../discord/commands/' + file);
    if (!fileModule.dontPushByDefault) guildCommands.push(fileModule.data);
  }

  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

  rest
    .put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id), {
      body: guildCommands,
    })
    .then(() =>
      console.log(
        'Registered command(s) to ' +
          guild.id +
          ': ' +
          guildCommands.map((el) => {
            return el.name;
          }),
      ),
    )
    .catch(console.error);
};
