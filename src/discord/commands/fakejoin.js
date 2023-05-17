const { SlashCommandBuilder } = require('discord.js');
const { onGuildJoin } = require('../join');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fakejoin')
    .setDescription('Fake the bot joining the server')
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    await onGuildJoin(interaction.guild);
    await interaction.reply('Fake join!');
  },
};
