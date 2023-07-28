/**
 *  This File acts as an inbox. Whenever anything of interest happens in a multiplayer channel, 
 *  one of the functions below is called. The event is 
 *  then sorted and passed to the correct place to be handled
 */

import type {
  BanchoMultiplayerChannel,
  ChannelMessage,
} from 'bancho.js';
import * as bracket from "../BracketMatch"
import { BracketMatch } from '../BracketMatch/match';
import type { Beatmap } from 'nodesu';
import { updateMessage } from '../BracketMatch/discord_message';



export const message = async (msg: ChannelMessage) => {
  if (msg.self) return;

  if (msg.user.ircUsername != "BanchoBot")
    console.log(`[${msg.channel.name}] >> ${msg.user.ircUsername}: ${msg.message}`);

  const match_id = msg.channel.name.replace('#mp_', "");
  const match = await bracket.getMatch(match_id)
  if (match) {
    const runFunction = bracket.phases[match.state]?.onMessage;
    if (!runFunction) return;
    const payload = runFunction(match, msg)
    bracket.payloadHandler(payload, match, msg.channel)
    if (msg.user.ircUsername != "BanchoBot") {
      try {
        await updateMessage(match, (msg.channel as BanchoMultiplayerChannel).lobby)
      } catch (e) {
        console.log(e)
      }
    }
  }
};


export const join = async (join: BracketMatch.PlayerJoined) => {
  console.log(
    `[${join.player.lobby.channel.name}] >> ${join.player.user.ircUsername} joined the lobby`,
  );

  const match_id = join.player.lobby.channel.name.replace('#mp_', "");
  const match = await bracket.getMatch(match_id)
  if (match) {
    const runFunction = bracket.phases[match.state]?.onJoin;
    if (!runFunction) return;
    const payload = runFunction(match, join.player)
    await bracket.payloadHandler(payload, match, join.player.lobby.channel)
    try {
      await updateMessage(match, join.player.lobby)
    } catch (e) {
      console.log(e)
    }
  }
};

export const ready = async (channel: BanchoMultiplayerChannel) => {
  console.log(`[${channel.name}] >> All Players are Ready!`);
  const match_id = channel.name.replace('#mp_', "");
  const match = await bracket.getMatch(match_id)
  if (match) {
    const runFunction = bracket.phases[match.state]?.onReady;
    if (!runFunction) return;
    const payload = runFunction(match, channel.lobby)
    await bracket.payloadHandler(payload, match, channel)

    try {
      await updateMessage(match, channel.lobby)
    } catch (e) {
      console.log(e)
    }
  }
};

export const beatmap = async (beatmap: Beatmap | null, channel: BanchoMultiplayerChannel) => {
  if (!beatmap) {
    console.log(`[${channel.name}] >> Map is being changed`);
    return;
  }
  console.log(`[${channel.name}] >> Map changed: ${beatmap.artist} - ${beatmap.title}`);

  const match_id = channel.name.replace('#mp_', "");
  const match = await bracket.getMatch(match_id)
  if (match) {
    const runFunction = bracket.phases[match.state]?.onBeatmap;
    if (!runFunction) return;
    const payload = runFunction(match, beatmap)
    await bracket.payloadHandler(payload, match, channel)
    try {
      await updateMessage(match, channel.lobby)
    } catch (e) {
      console.log(e)
    }
  }
};


export const finished = async (scores: BracketMatch.Score[], channel: BanchoMultiplayerChannel) => {
  console.log(`[${channel.name}] >> The match has finished!`);

  const match_id = channel.name.replace('#mp_', "");
  const match = await bracket.getMatch(match_id)
  if (match) {
    const runFunction = bracket.phases[match.state]?.onFinish;
    if (!runFunction) return;
    const payload = runFunction(match, scores)
    await bracket.payloadHandler(payload, match, channel)
    try {
      await updateMessage(match, channel.lobby, scores)
    } catch (e) {
      console.log(e)
    }
  }
};

