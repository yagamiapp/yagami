const { SlashCommandSubcommandBuilder } = require('discord.js');
let { EmbedBuilder, Colors } = require('discord.js');
let { execute } = require('../../buttons/round_list');
const { fetchGuild, prisma } = require('../../../lib/prisma');

module.exports = {
  data: new SlashCommandSubcommandBuilder().setName('list').setDescription('List the rounds'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let guild = await fetchGuild(interaction.guildId);
    let tournament = guild.active_tournament;
    let rounds = await prisma.round.findMany({
      where: { tournamentId: tournament.id },
    });

    // In case there are no rounds
    if (rounds == []) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: There are no rounds in this tournament.')
        .setColor(Colors.Red);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    execute(interaction, { options: { index: 0, admin: false } });
  },
};
