let { SlashCommandSubcommandBuilder } = require('discord.js');
let { EmbedBuilder, Colors } = require('discord.js');
let { fetchGuild, prisma } = require('../../../../lib/prisma');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('create')
    .setDescription('Creates a new matchup')
    .addStringOption((option) =>
      option.setName('round').setDescription('The round acronym').setRequired(true)
    )
    .addUserOption((option) =>
      option.setName('team1').setDescription('Any user from the first team').setRequired(true)
    )
    .addUserOption((option) =>
      option.setName('team2').setDescription('Any user from the second team').setRequired(true)
    ),
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

    let round = await prisma.round.findFirst({
      where: {
        tournamentId: tournament.id,
        acronym: interaction.options.getString('round').toUpperCase(),
      },
    });

    let users = [interaction.options.getUser('team1'), interaction.options.getUser('team2')];

    let teams = [
      await prisma.team.findFirst({
        where: {
          tournamentId: tournament.id,
          Members: {
            some: {
              User: {
                DiscordAccounts: {
                  some: {
                    id: users[0].id,
                  },
                },
              },
            },
          },
        },
      }),
      await prisma.team.findFirst({
        where: {
          tournamentId: tournament.id,
          Members: {
            some: {
              User: {
                DiscordAccounts: {
                  some: {
                    id: users[1].id,
                  },
                },
              },
            },
          },
        },
      }),
    ];

    // In case the given acronym is not valid
    if (!round) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: The round acronym is not valid')
        .setColor(Colors.Red)
        .setFooter({
          text: 'Use /rounds list to see all the rounds',
        });
      interaction.editReply({ embeds: [embed] });
      return;
    }

    // In case the team1 user is not on a team
    if (!teams[0]) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: The user from team 1 is not on a team')
        .setColor(Colors.Red)
        .setFooter({
          text: 'Use /teams list to see all the teams',
        });
      interaction.editReply({ embeds: [embed] });
      return;
    }

    // In case the team 2 user is not on a team
    if (!teams[1]) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: The user from team 2 is not on a team')
        .setColor(Colors.Red)
        .setFooter({
          text: 'Use /teams list to see all the teams',
        });
      interaction.editReply({ embeds: [embed] });
      return;
    }

    // In case the teams are the same
    if (teams[0].id == teams[1].id) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: The teams are the same')
        .setColor(Colors.Red)
        .setFooter({
          text: 'Use /teams list to see all the teams',
        });
      interaction.editReply({ embeds: [embed] });
      return;
    }

    let match = await prisma.match.create({
      data: {
        state: 10,
        roundId: round.id,
      },
    });

    // Create teams in match
    for (let team of teams) {
      await prisma.teamInMatch.create({
        data: {
          Team: {
            connect: {
              id: team.id,
            },
          },
          Match: {
            connect: {
              id: match.id,
            },
          },
          score: 0,
        },
      });
    }

    // Create maps in match
    let mappool = await prisma.mapInPool.findMany({
      where: {
        Mappool: {
          Round: {
            id: round.id,
          },
        },
      },
    });

    for (let map of mappool) {
      await prisma.mapInMatch.create({
        data: {
          Map: {
            connect: {
              identifier_mappoolId: {
                identifier: map.identifier,
                mappoolId: map.mappoolId,
              },
            },
          },
          Match: {
            connect: {
              id: match.id,
            },
          },
        },
      });
    }

    let embed = new EmbedBuilder()
      .setTitle('Matchup created')
      .setDescription('The matchup has been created')
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
        value: teamString,
        inline: true,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
