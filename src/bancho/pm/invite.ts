import type { BanchoClient, BanchoMessage } from 'bancho.js';
// import { prisma } from '../../lib/prisma';
// import { Match } from '@prisma/client';

export const name = 'invite';
export const desc = 'Sends an invite to your lobby';
export const usage = '!invite';

export const exec = async (msg: BanchoMessage, _: string[], client: BanchoClient) => {
  // const id = (await msg.user.fetchFromAPI()).id;
  // const match: Match = await prisma.match.findFirst({
  //   where: {
  //     state: {
  //       gte: 0,
  //       lte: 7,
  //       not: 3,
  //     },
  //     Teams: {
  //       some: {
  //         Team: {
  //           Members: {
  //             some: {
  //               User: {
  //                 id: id,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // });
  // Get channel
  // const channelId = match.mp_link.match(/\d*$/g);
  // const channel = client.getChannel(`#mp_${channelId[0]}`);
  // await msg.user.sendMessage('Sending another invite:');
  // await channel.sendMessage(`!mp invite #${id}`);
  // let matc = await msg.channel.sendMessage("Pong!");
};
