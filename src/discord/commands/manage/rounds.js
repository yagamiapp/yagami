const { SlashCommandSubcommandGroupBuilder } = require('discord.js');
const fs = require('fs');

// Subcommand Handler
let data = new SlashCommandSubcommandGroupBuilder()
  .setName('rounds')
  .setDescription('Configuring agent for the rounds in your tournament');
let subcommands = {};

const subcommandFiles = fs
  .readdirSync('./src/discord/commands/manage/rounds')
  .filter((file) => file.endsWith('.js'));

for (const file of subcommandFiles) {
  const subcommand = require(`./rounds/${file}`);
  data.addSubcommand(subcommand.data);
  subcommands[subcommand.data.name] = subcommand;
}

module.exports = {
  data,
  async execute(interaction) {
    let subcommand = interaction.options.getSubcommand();
    let file = subcommands[subcommand];
    await file.execute(interaction);
  },
};
