let {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  InteractionType,
} = require('discord.js');
const { fetchGuild, prisma } = require('../../lib/prisma');

module.exports = {
  data: { customId: 'view_match' },
  async execute(interaction, command) {
    let guild = await fetchGuild(interaction.guildId);
    let tournament = guild.active_tournament;

    let round = await prisma.round.findFirst({
      where: {
        tournamentId: tournament.id,
        acronym: command.options.round,
      },
    });
    let match = await prisma.match.findFirst({
      where: { roundId: round.id, id: parseInt(command.options.id) },
    });
    let teams = await prisma.team.findMany({
      where: { InBracketMatches: { some: { matchId: match.id } } },
    });

    let back = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId('match_start_list?index=' + command.options.index)
        .setLabel('◀ Back to Matches')
        .setStyle(ButtonStyle.Danger),
    ]);

    let embed = new EmbedBuilder()
      .setTitle(`${round.acronym}: ${teams[0].name} vs ${teams[1].name}`)
      .setColor(tournament.color)
      .setThumbnail(tournament.icon_url);

    // Construct team strings
    for (let team of teams) {
      let teamString = '';
      let members = await prisma.user.findMany({
        where: {
          InTeams: {
            some: {
              teamId: team.id,
            },
          },
        },
      });
      for (let i = 0; i < members.length; i++) {
        let member = members[i];
        let rank = member.osu_pp_rank;
        if (rank == null) {
          rank = 'Unranked';
        } else {
          rank = `${rank.toLocaleString()}`;
        }

        teamString += `
                    :flag_${member.osu_country_code.toLowerCase()}: ${
          member.osu_username
        } (#${rank})`;
        if (i == 0) {
          teamString += ' **(c)**';
        }
      }
      embed.addFields({
        name: team.name,
        value: teamString,
        inline: true,
      });
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      await interaction.editReply({
        embeds: [embed],
      });
      return;
    }
    await interaction.update({
      embeds: [embed],
      components: [back],
    });
  },
};
