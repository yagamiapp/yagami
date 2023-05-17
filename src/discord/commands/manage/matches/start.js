let { SlashCommandSubcommandBuilder } = require('discord.js');
let { EmbedBuilder, Colors } = require('discord.js');
let { fetchGuild } = require('../../../../lib/prisma');
let { execute } = require('../../../buttons/match_start_list');

module.exports = {
  data: new SlashCommandSubcommandBuilder().setName('start').setDescription('Starts a match'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let guild = await fetchGuild(interaction.guildId);
    let tournament = guild.active_tournament;

    // In case there is no active tournament
    if (!tournament) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: No active tournament.')
        .setColor(Colors.Red)
        .setFooter({
          text: 'You can make a new tournament with /tournament create',
        });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    await execute(interaction, {
      options: { index: 0 },
    });
  },
};
