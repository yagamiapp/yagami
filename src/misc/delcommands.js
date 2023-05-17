const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

let guildId = '611064433623695370';

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

rest
  .put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId), {
    body: [],
  })
  .then(() => console.log('Deleted command(s) in ' + guildId))
  .catch(console.error);
