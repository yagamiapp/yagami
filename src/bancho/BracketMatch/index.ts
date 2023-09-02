import * as pick from './phases/0_pick';
import * as ban from './phases/7_ban';
import * as ready from './phases/1_ready';
import * as playing from './phases/2_playing';
import * as startup from './phases/3_startup';
import * as warmup from './phases/4_warmup';
import * as rolling from './phases/5_rolling';
import * as order from './phases/6_order_selection';

import {
  BanchoChannel,
  BanchoLobby,
  BanchoLobbyPlayer,
  BanchoMultiplayerChannel,
  ChannelMessage,
} from 'bancho.js';
import type { BracketMatch } from './match';
import type { Beatmap } from 'nodesu';
import Match from './classes/Match';
import MatchPayloadBuilder from './classes/MatchPayloadBuilder';
import { isPromise } from 'util/types';
import { prisma } from '../../lib/prisma';

// type Partials = {
//   choosing: boolean;
//   banning: boolean;
//   picking: boolean;
//   readying: boolean;
// };

type ReturnValue = Promise<MatchPayloadBuilder> | Promise<void> | MatchPayloadBuilder | void;

type PhaseHandler = {
  onMessage?: (match: Match, msg: ChannelMessage) => ReturnValue;
  onReady?: (match: Match, lobby: BanchoLobby) => ReturnValue;
  onFinish?: (match: Match, scores: BracketMatch.Score[]) => ReturnValue;
  onJoin?: (match: Match, player: BanchoLobbyPlayer) => ReturnValue;
  onBeatmap?: (match: Match, map: Beatmap) => ReturnValue;
  onPhaseChange?: (match: Match, lobby: BanchoLobby) => ReturnValue;
};

export const phases: { [key: number]: PhaseHandler } = {
  0: pick,
  1: ready,
  2: playing,
  3: startup,
  4: warmup,
  5: rolling,
  6: order,
  7: ban,
};

export const payloadHandler = async (
  payload: ReturnValue,
  match: Match,
  channel: BanchoChannel,
) => {
  if (isPromise(payload)) payload = await payload;
  if (!payload) return;
  if (!isMultiplayerChannel(channel)) return;

  console.log(payload);

  if (payload.invite.length > 0) {
    for (const user of payload.invite) {
      await channel.lobby.invitePlayer(user);
    }
  }

  if (payload.moves.length > 0) {
    for (const move of payload.moves) {
      await channel.sendMessage(`!mp move ${move.username} ${move.to}`);
    }
  }

  if (payload.start) {
    await channel.lobby.startMatch(payload.start);
  }

  if (payload.abort) {
    await channel.lobby.abortMatch();
  }

  if (payload.name) {
    await channel.lobby.setName(payload.name);
  }

  if (payload.settings) {
    await channel.lobby.setSettings(payload.settings[0], payload.settings[1], payload.settings[2]);
  }

  if (payload.mods) {
    await channel.lobby.setMods(payload.mods);
  }

  if (payload.map) {
    await channel.lobby.setMap(payload.map);
  }

  if (payload.host) {
    await channel.lobby.setHost(payload.host);
  }

  if (payload.clearhost) {
    await channel.lobby.clearHost();
  }

  if (payload.waiting_on != null) {
    await prisma.match.update({
      where: {
        id: match.id,
      },
      data: {
        waiting_on: payload.waiting_on,
      },
    });
  }

  if (payload.teamScore.length > 0) {
    for (const teamScore of payload.teamScore) {
      await prisma.teamInMatch.update({
        where: {
          teamId_matchId: {
            teamId: teamScore.id,
            matchId: match.id,
          },
        },
        data: {
          score: teamScore.set
        },
      });
    }
  }

  if (payload.teamWarmUp.length > 0) {
    for (const teamWarmUp of payload.teamWarmUp) {
      await prisma.teamInMatch.update({
        where: {
          teamId_matchId: {
            teamId: teamWarmUp.id,
            matchId: match.id,
          },
        },
        data: {
          warmed_up: teamWarmUp.set,
        },
      });
    }
  }

  if (payload.teamRoll.length > 0) {
    for (let teamRoll of payload.teamRoll) {
      teamRoll = teamRoll.set === 0 ? null : teamRoll;
      await prisma.teamInMatch.update({
        where: {
          teamId_matchId: {
            teamId: teamRoll.id,
            matchId: match.id,
          },
        },
        data: {
          roll: teamRoll.set,
        },
      });
    }
  }

  if (payload.teamPickOrder.length > 0) {
    for (const teamPickOrder of payload.teamPickOrder) {
      await prisma.teamInMatch.update({
        where: {
          teamId_matchId: {
            teamId: teamPickOrder.id,
            matchId: match.id,
          },
        },
        data: {
          pick_order: teamPickOrder.set,
        },
      });
    }
  }

  if (payload.teamBanOrder.length > 0) {
    for (const teamBanOrder of payload.teamBanOrder) {
      await prisma.teamInMatch.update({
        where: {
          teamId_matchId: {
            teamId: teamBanOrder.id,
            matchId: match.id,
          },
        },
        data: {
          ban_order: teamBanOrder.set,
        },
      });
    }
  }

  if (payload.bans.length > 0) {
    for (const ban of payload.bans) {
      await prisma.mapInMatch.update({
        where: {
          mapIdentifier_matchId: {
            mapIdentifier: ban.identifier,
            matchId: match.id,
          },
        },
        data: {
          BannedByTeam: {
            connect: {
              teamId_matchId: {
                matchId: match.id,
                teamId: ban.teamId,
              },
            },
          },
        },
      });
    }
  }

  if (payload.picks.length > 0) {
    for (const pick of payload.picks) {
      await prisma.mapInMatch.update({
        where: {
          mapIdentifier_matchId: {
            mapIdentifier: pick.identifier,
            matchId: match.id,
          },
        },
        data: {
          pickNumber: match.maps.filter((x) => x.picked).length + 1,
          pickTeamNumber: match.teams[match.waiting_on].picks.length + 1,
          PickedByTeam: {
            connect: {
              teamId_matchId: {
                matchId: match.id,
                teamId: pick.teamId,
              },
            },
          },
        },
        include: {
          Map: true,
        },
      });
    }
  }

  if (payload.wins.length > 0) {
    for (const wins of payload.wins) {
      await prisma.mapInMatch.update({
        where: {
          mapIdentifier_matchId: {
            mapIdentifier: wins.identifier,
            matchId: match.id,
          },
        },
        data: {
          WonBy: {
            connect: {
              teamId_matchId: {
                matchId: match.id,
                teamId: wins.teamId,
              },
            },
          },
        },
      });
    }
  }

  if (payload.messages.length > 0) {
    for (const msg of payload.messages) {
      await channel.sendMessage(msg);
    }
  }

  if (payload.state != null) {
    await prisma.match.update({
      where: {
        id: match.id,
      },
      data: {
        state: payload.state,
      },
    });
    match = await getMatch(match.mp_link.match(/\d+/)[0]);

    const phaseChangeFunction = phases[payload.state]?.onPhaseChange;
    if (phaseChangeFunction) {
      payload = phaseChangeFunction(match, channel.lobby);
      if (payload) payloadHandler(payload, match, channel);
    }
  }
};

export const getMatch = async (mp_id: string): Promise<Match> => {
  const dbMatch = await prisma.match.findFirst({
    where: {
      mp_link: `https://osu.ppy.sh/community/matches/${mp_id}`,
    },
    include: {
      Round: {
        include: {
          Tournament: true,
          mappool: {
            include: {
              Maps: {
                include: {
                  Map: true,
                },
              },
            },
          },
        },
      },
      Teams: {
        include: {
          Team: {
            include: {
              Members: {
                orderBy: {
                  member_order: 'asc',
                },
                include: {
                  User: true,
                },
              },
            },
          },
          Bans: {
            include: {
              Map: {
                include: {
                  Map: true,
                },
              },
            },
          },
          Picks: {
            orderBy: {
              pickNumber: 'asc',
            },
            include: {
              Map: {
                include: {
                  Map: true,
                },
              },
            },
          },
          Wins: {
            include: {
              Map: {
                include: {
                  Map: true,
                },
              },
            },
          },
        },
      },
      MapsInMatch: {
        include: {
          Map: {
            include: {
              Map: true,
            },
          },
        },
      },
    },
  });
  if (!dbMatch) throw new Error('Match does not exist');
  const match = new Match(dbMatch);
  return match;
};

const isMultiplayerChannel = (
  channel: BanchoChannel | BanchoMultiplayerChannel,
): channel is BanchoMultiplayerChannel => {
  return (channel as BanchoMultiplayerChannel).lobby !== undefined;
};
