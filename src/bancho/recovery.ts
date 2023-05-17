import { prisma } from "../lib/prisma";
import { MatchManager } from "./match-types/bracket/Match";
import { bot } from "../discord";
import { EmbedBuilder } from "discord.js";

export const recover = async () => {
  const matches = await prisma.match.findMany({});

  for (const match of matches) {
    if (match.state < 8 && match.state != -1) {
      const manager = new MatchManager(match.id, match.mp_link);
      await manager.createMatch();
    } else if (match.state == -1) {
      const channel = await bot.channels.fetch(match.channel_id);
      const message = await channel.messages.fetch(match.message_id);

      const round = await prisma.round.findUnique({
        where: {
          id: match.roundId,
        },
      });

      const teams = await prisma.team.findMany({
        where: {
          InBracketMatches: {
            some: {
              matchId: match.id,
            },
          },
        },
      });

      const finalEmbed = EmbedBuilder.from(message.embeds[0]);
      finalEmbed
        .setTitle(`DELETED: ${round.acronym}: (${teams[0].name}) vs (${teams[1].name})`)
        .setColor('#555555')
        .setFooter({ text: 'Match Deleted' })
        .setTimestamp();

      await prisma.match.delete({
        where: {
          id: match.id,
        },
      });

      await message.edit({ embeds: [finalEmbed], components: [] });
    }
  }
}
