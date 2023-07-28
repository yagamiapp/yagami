import { Guild, PrismaClient, Tournament } from '@prisma/client';

export const prisma = new PrismaClient();

type CurrentGuild = Guild & {
  tournaments?: Tournament[];
  active_tournament?: number;
};

export const fetchGuild = async (id: string) => {
  const guild: CurrentGuild = await prisma.guild.findFirst({
    where: {
      guild_id: id,
    },
  });
  const tournaments = await prisma.tournament.findMany({
    where: {
      Guild_id: id,
    },
  });
  guild.tournaments = tournaments;
  return guild;
};
