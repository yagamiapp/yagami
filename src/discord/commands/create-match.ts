import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "../../lib/prisma";

export const data = new SlashCommandBuilder()
  .setName("create-match")
  .setDescription("This is a development command to create a scrim match used for testing.")

export const execute = async (interaction: CommandInteraction) => {
  await interaction.deferReply({ ephemeral: true })
  const guildObj = await prisma.guild.upsert({
    where: {
      guild_id: interaction.guildId
    },
    create: {
      change_nickname: false,
      guild_id: interaction.guildId
    },
    update: {
    }
  })

  if (!guildObj.active_tournament) return await interaction.editReply("This server has no tournament, make one first!")

  const tournament = await prisma.tournament.findUnique({
    where: {
      "id": guildObj.active_tournament
    },
    include: {
      "rounds": {
        "include": {
          "mappool": {
            "include": {
              "Maps": true
            }
          }
        }
      }
    }
  })

  // Check user object
  const user = await prisma.user.findFirst({
    where: {
      "DiscordAccounts": {
        'some': {
          "id": interaction.user.id
        }
      }
    }
  })

  if (!user) return await interaction.editReply("You don't have an account registered")

  // Create two teams, both with the user
  const teams = await prisma.team.findMany({
    where: {
      "tournamentId": tournament.id,
      "Members": {
        "some": {
          "osuId": user.id
        }
      }
    }
  })

  for (let i = 0; i < 2 - teams.length; i++) {
    const team = await prisma.team.create({
      data: {
        "Tournament": {
          "connect": {
            "id": tournament.id
          }
        },
        "name": "test team",
        "color": tournament.color,
        "icon_url": tournament.icon_url,
        "Members": {
          "create": {
            "osuId": user.id
          }
        }
      }
    })
    teams.push(team);
  }


  const match = await prisma.match.create({
    data: {
      "state": 10,
      start_time: new Date(),
      "Round": {
        connect: {
          id: tournament.rounds[0].id
        }
      }
    }
  })

  for (const team of teams) {
    await prisma.teamInMatch.create({
      "data": {
        score: 0,
        Team: {
          connect: {
            id: team.id
          }
        },
        Match: {
          connect: {
            id: match.id
          }
        }
      }
    })
  }

  for (const map of tournament.rounds[0].mappool.Maps) {
    await prisma.mapInMatch.create({
      data: {
        "Match": {
          "connect": {
            "id": match.id
          }
        },
        "Map": {
          "connect": {
            "identifier_mappoolId": {
              "identifier": map.identifier,
              "mappoolId": tournament.rounds[0].mappoolId,
            }
          }
        }
      }
    })
  }

  await interaction.editReply("Done!")
}