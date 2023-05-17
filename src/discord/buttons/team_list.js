let {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  InteractionType,
  Colors,
} = require('discord.js');
const { fetchGuild, prisma } = require('../../lib/prisma');

module.exports = {
  data: { customId: 'team_list' },
  async execute(interaction, command) {
    let guild = await fetchGuild(interaction.guildId);
    let tournament = guild.active_tournament;
    let teams = await prisma.team.findMany({
      where: {
        tournamentId: tournament.id,
      },
    });

    // In case there are no teams
    if (teams.length == 0) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: There are no teams in this tournament.')
        .setColor(Colors.Red);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Add member objects to each team
    for (const team of teams) {
      let membersInTeam = await prisma.user.findMany({
        where: {
          InTeams: {
            some: {
              teamId: team.id,
            },
          },
        },
      });
      team.members = membersInTeam;
    }
    // Sort teams by average rank
    teams.sort((a, b) => {
      let aAvg = 0;
      let bAvg = 0;

      for (let i = 0; i < a.members.length; i++) {
        let user = a.members[i];
        if (user.osu_pp_rank) {
          aAvg += user.pp_rank;
        }
      }

      for (let i = 0; i < b.members.length; i++) {
        let user = b.members[i];
        if (user.osu_pp_rank) {
          bAvg += user.pp_rank;
        }
      }

      aAvg /= a.members.length;
      bAvg /= b.members.length;
      return aAvg - bAvg;
    });
    // Group elements into groups of 3
    let groups = [];
    let groupSize = 3;
    for (let i = 0; i < teams.length; i += groupSize) {
      groups.push(teams.slice(i, i + groupSize));
    }
    let index = parseInt(command.options.index);

    // Select first round and build embed
    let group = groups[index];

    // Build buttons to scroll to other rounds
    let leftButton = new ButtonBuilder()
      .setCustomId('team_list?index=' + (index - 1))
      .setLabel('◀')
      .setStyle(ButtonStyle.Primary);

    let pageButton = new ButtonBuilder()
      .setCustomId(`pager?list=team_list&min=1&max=${groups.length}`)
      .setLabel(`${index + 1}/${groups.length}`)
      .setStyle(ButtonStyle.Secondary);

    let rightButton = new ButtonBuilder()
      .setCustomId('team_list?index=' + (index + 1))
      .setLabel('▶')
      .setStyle(ButtonStyle.Primary);

    if (index === 0) {
      leftButton.setDisabled(true);
    }

    if (groups.length === 1) {
      pageButton.setDisabled(true);
    }

    if (index === groups.length - 1) {
      rightButton.setDisabled(true);
    }

    let components = new ActionRowBuilder().addComponents(leftButton, pageButton, rightButton);

    let embed = new EmbedBuilder()
      .setTitle('Teams')
      .setColor(tournament.color || '#F88000')
      .setThumbnail(tournament.icon_url);

    for (let i = 0; i < group.length; i++) {
      let team = group[i];
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
        let rank = member.pp_rank;
        if (rank == null) {
          rank = 'Unranked';
        } else {
          rank = `${rank.toLocaleString()}`;
        }

        teamString += `
				:flag_${member.country_code.toLowerCase()}: ${member.username} (#${rank})`;
        if (i == 0) {
          teamString += ' **(c)**';
        }
      }
      embed.addFields({
        name: team.name,
        value: teamString || 'No members',
      });
    }

    if (interaction.type == InteractionType.ApplicationCommand) {
      await interaction.editReply({
        embeds: [embed],
        components: [components],
      });
      return;
    }
    await interaction.update({
      embeds: [embed],
      components: [components],
    });
  },
};
