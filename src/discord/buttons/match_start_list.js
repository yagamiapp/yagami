let {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Colors,
  InteractionType,
} = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const { fetchGuild, prisma } = require('../../lib/prisma');

module.exports = {
  data: { customId: 'match_start_list' },
  async execute(interaction, command) {
    let guild = await fetchGuild(interaction.guildId);
    let tournament = guild.active_tournament;
    let matches = await prisma.match.findMany({
      where: {
        Round: {
          Tournament: {
            id: tournament.id,
          },
        },
      },
    });

    // Add a local tournament match ID to each match
    for (let i = 0; i < matches.length; i++) {
      matches[i].tournamentId = i + 1;
    }

    matches = matches.filter((x) => [3, 10].includes(x.state));

    // Group elements into groups of 2
    let groups = [];
    let groupSize = 2;
    for (let i = 0; i < matches.length; i += groupSize) {
      groups.push(matches.slice(i, i + groupSize));
    }

    // In case there are no matches
    if (groups.length == 0) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: There are no matches to start')
        .setColor(Colors.Red)
        .setFooter({
          text: 'You can create a match with /matches create',
        });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Select group and build embed
    let index = parseInt(command.options.index);
    let group = groups[index];
    if (!group) group = groups[0];

    // Build buttons to scroll to other rounds
    let leftButton = new ButtonBuilder()
      .setCustomId('match_start_list?index=' + (index - 1))
      .setLabel('◀')
      .setStyle(ButtonStyle.Primary);

    let pageButton = new ButtonBuilder()
      .setCustomId(`pager?list=match_start_list&min=1&max=${groups.length}`)
      .setLabel(`${index + 1}/${groups.length}`)
      .setStyle(ButtonStyle.Secondary);

    let rightButton = new ButtonBuilder()
      .setCustomId('match_start_list?index=' + (index + 1))
      .setLabel('▶')
      .setStyle(ButtonStyle.Primary);

    if (index == 0) {
      leftButton.setDisabled(true);
    }

    if (groups.length === 1) {
      pageButton.setDisabled(true);
    }

    if (index == groups.length - 1) {
      rightButton.setDisabled(true);
    }

    let pages = new ActionRowBuilder().addComponents(leftButton, pageButton, rightButton);
    let embed = new EmbedBuilder()
      .setColor(tournament.color)
      .setTitle(`Matches to start`)
      .setDescription(
        stripIndents`
			The following matches have not been started yet, 
			click the respective button to start them.
            `
      )
      .setThumbnail(tournament.icon_url);

    let startButtons = new ActionRowBuilder();
    let viewButtons = new ActionRowBuilder();
    for (let match of group) {
      let teams = await prisma.team.findMany({
        where: {
          InBracketMatches: {
            some: {
              matchId: match.id,
            },
          },
        },
      });

      let round = await prisma.round.findFirst({
        where: {
          id: match.roundId,
        },
      });

      embed.addFields({
        name: `${round.acronym}: Match ${match.tournamentId}`,
        value: `${teams[0].name} vs ${teams[1].name}`,
        inline: true,
      });
      let startButton = new ButtonBuilder()
        .setLabel('Start match ' + match.tournamentId)
        .setCustomId('start_match?id=' + match.id + '&index=' + index)
        .setStyle(ButtonStyle.Success);
      if (match.state != 10) {
        startButton.setLabel('Started match ' + match.tournamentId).setDisabled(true);
      }
      startButtons.addComponents([startButton]);
      viewButtons.addComponents([
        new ButtonBuilder()
          .setLabel('View match ' + match.tournamentId)
          .setCustomId('view_match?id=' + match.id + '&index=' + index)
          .setStyle(ButtonStyle.Secondary),
      ]);
    }

    if (interaction.type === InteractionType.ApplicationCommand) {
      await interaction.editReply({
        embeds: [embed],
        components: [viewButtons, startButtons, pages],
      });
      return;
    }
    await interaction.update({
      embeds: [embed],
      components: [viewButtons, startButtons, pages],
    });
  },
};
