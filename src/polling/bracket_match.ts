import { prisma } from "../lib/prisma"
import { bot } from "../discord"
import { stripIndents } from "common-tags"
import { EmbedBuilder, ColorResolvable } from "discord.js"
import { Round, Team, Tournament } from "@prisma/client"
import env from "../lib/env"

export const pollingInterval = 5000

let running = false;
export const onInterval = async () => {
  if (running) return;
  running = true;
  const matchesToStart = await getMatches();


  for (const match of matchesToStart) {
    // TODO: Handle the lack of a match result channel by prompting to set one on message
    if (!match.Round.Tournament.Guild.match_results_channel) continue;

    const channel = await bot.channels.fetch(match.Round.Tournament.Guild.match_results_channel)
    if (!channel) continue;

    const embed = getEmbed(match.Round.Tournament, match.Teams.map(x => x.Team), match.Round)
    const players = await getPlayers(match.id);

    let playerString = "";
    for (const player of players) {
      playerString += `<@${player.DiscordAccounts[0].id}> `;
    }

    if (!channel.isTextBased()) return;
    const message = await channel.send({ content: playerString, embeds: [embed] })

    await prisma.match.update({
      where: {
        "id": match.id
      },
      "data": {
        "channel_id": channel.id,
        "message_id": message.id,
        "state": 3,
      }
    })
  }
  running = false;
}

const getPlayers = (id: number) =>
  prisma.user.findMany({
    where: {
      InTeams: {
        some: {
          Team: {
            InBracketMatches: {
              some: {
                matchId: id,
              },
            },
          },
        },
      },
    },
    include: {
      DiscordAccounts: {
        select: {
          id: true,
        },
      },
    },
  });


const getMatches = () => prisma.match.findMany({
  where: {
    "state": 10,
    "start_time": {
      "lte": new Date()
    }
  },
  include: {
    "Teams": {
      "include": {
        "Team": true
      }
    },
    "Round": {
      "include": {
        "Tournament": {
          "include": {
            "Guild": true
          }
        }
      }
    }
  }
})


const getEmbed = (tournament: Tournament, teams: Team[], round: Round) => new EmbedBuilder()
  .setTitle(
    `${round.acronym}: (${teams[0].name}) vs (${teams[1].name})`
  )
  .setColor((tournament.color as ColorResolvable))
  .setThumbnail(tournament.icon_url)
  .setAuthor({ name: tournament.name, iconURL: tournament.icon_url })
  .setFooter({ text: "Current Phase: Waiting for MP Link" })
  .setDescription(
    `
            Your match is ready!
            
            Here's what you need to do to get started:
            `
  )
  .addFields(
    {
      name: "Create the match",
      value: stripIndents`
                Select one member of your match to make the lobby, by sending a DM to \`BanchoBot\` on osu:
                \`\`\`
                !mp make ${tournament.acronym}: (${teams[0].name}) vs (${teams[1].name})
                \`\`\`
            `,
    },
    {
      name: "Add yagami as a ref",
      value: stripIndents`
				Add the bot as a ref to your match:
				\`\`\`
				!mp addref ${env.bancho.username}
				\`\`\`
				`,
    },
    {
      name: "Point the bot to the match",
      value: stripIndents`
				Get the link to your match and paste it into the \`/match addlink\` command in this server
				\`\`\`
				/match addlink link:https://osu.ppy.sh/...
				\`\`\`
			`,
    }
  );

