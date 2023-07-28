import {
  BanchoChannel,
  BanchoClient,
  BanchoClientOptions,
  BanchoMultiplayerChannel,
  BanchoUser,
} from 'bancho.js';
import { pmHandler } from './pm';
import env from '../lib/env';
import { message, join, ready, beatmap, finished } from './cm';
import type { Multi, MultiScore } from 'nodesu';
import { prisma } from '../lib/prisma';
import { getMatch, payloadHandler, phases } from './BracketMatch';

type Score = {
  score: MultiScore;
  user: BanchoUser;
};

const credentials: BanchoClientOptions = env.bancho;

export const client = new BanchoClient(credentials);

export const init = () => {
  client.on('PM', pmHandler);
  client.on('CM', message);
  client.on('connected', onReady);

  client.connect();
};

const onReady = async () => {
  console.log('Connected to Bancho!');

  // Get in progress matches and connect to them
  const matches = await prisma.match.findMany({
    where: {
      mp_link: {
        not: null,
      },
      state: {
        lte: 7,
        gte: 0,
      },
    },
  });

  for (const match of matches) {
    const link = match.mp_link;
    const id = link.match(/\d+/)[0];
    joinChannel(parseInt(id), match.state);
  }
};

export const joinChannel = async (mpId: number, matchState: number) => {
  const channel = client.getChannel(`#mp_${mpId}`);
  try {
    await channel.join();
  } catch (e) {
    const error = `Channel #mp_${mpId} is not joinable`;
    console.log(error);
    return { error };
  }

  if (!isMultiplayerChannel(channel)) return { error: 'Requested ID is not a multiplayer channel' };

  channel.lobby.on('playerJoined', join);
  channel.lobby.on('allPlayersReady', () => ready(channel));
  channel.lobby.on('beatmap', (b) => beatmap(b, channel));
  channel.lobby.on('matchFinished', async () => {
    // Please fix bancho.js, this is a headache and a half
    const gameData = await client.osuApi.multi.getMatch(mpId);
    if (!isMulti(gameData)) {
      console.log(gameData);
      return;
    }

    const lastGame = gameData.games[gameData.games.length - 1];
    const scores: Score[] = [];
    for (const score of lastGame.scores) {
      scores.push({
        score,
        user: await client.getUserById(score.userId),
      });
    }
    finished(scores, channel);
  });

  // Run phase change handler to recover from restart
  const recoverFunction = phases[matchState]?.onPhaseChange;
  const match = await getMatch(`${mpId}`);
  if (!recoverFunction) return;
  await channel.lobby.updateSettings();
  const payload = recoverFunction(match, channel.lobby);
  await payloadHandler(payload, match, channel);
};

const isMultiplayerChannel = (
  channel: BanchoChannel | BanchoMultiplayerChannel,
): channel is BanchoMultiplayerChannel => {
  return (channel as BanchoMultiplayerChannel).lobby !== undefined;
};

const isMulti = (o: object | Multi): o is Multi => {
  return (o as Multi).games !== undefined;
};
