import { EmbedBuilder, Guild, REST, Routes, TextChannel } from 'discord.js';
import { readdirSync } from 'fs';
import env from './env';

export const deployCommands = async (guild: Guild, errorChannel?: TextChannel) => {
  const guildCommands = [];

  const files = readdirSync('./src/discord/commands')
    .filter((file) => file.endsWith('.ts'))
    .filter((file) => file != 'index.ts');

  for (const file of files) {
    const fileModule = await import('../discord/commands/' + file);
    if (!fileModule.dontPushByDefault) guildCommands.push(fileModule.data);
  }

  const rest = new REST({ version: '10' }).setToken(env.discord.token);

  rest
    .put(Routes.applicationGuildCommands(env.discord.client_id, guild.id), {
      body: guildCommands,
    })
    .then(() =>
      console.log(
        'Registered command(s) to ' +
          guild.id +
          ': ' +
          guildCommands.map((el) => {
            return el.name;
          })
      )
    )
    .catch(async (e) => {
      console.error(e);
      const embed = new EmbedBuilder()
        .setTitle('Error while registering commands')
        .setDescription(
          'We had trouble trying to register the commands for this application. This bot will not function properly without the commands being registered!'
        )
        .addFields(
          {
            name: 'Invite Link',
            value:
              'Make sure you are using a valid invite link. If you created the link yourself, you might be missing the correct permissions',
          },
          {
            name: 'Contact the Dev',
            value:
              'If you are still having trouble, [reach out the the developer](https://clxxiii.dev/#contact) for additional help.',
          }
        );

      try {
        await errorChannel.send({ embeds: [embed] });
      } catch (e) {
        console.log(
          `Cannot send application error message to selected channel, ${errorChannel.name}`
        );
      }
    });
};
