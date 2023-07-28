import { BanchoLobby, BanchoLobbyPlayer, ChannelMessage } from 'bancho.js';
import { BracketMatch } from '../match';
import type Match from '../classes/Match';
import { states, timers } from '../config';
import MatchPayloadBuilder from '../classes/MatchPayloadBuilder';

const warmupSlots = 16;

export const onMessage = (match: Match, msg: ChannelMessage) => {
  if (match.waiting_on == null) return;
  const team = match.teams[match.waiting_on];
  const user = team.members.find((x) => x.id == msg?.user?.id);
  if (user == null) return;

  const command = msg.message.match(/^!skip/g);
  if (!command) return;

  const payload = switchTeams(match);
  return payload;
};

export const onFinish = (match: Match, _scores: BracketMatch.Score[]) => {
  return switchTeams(match);
};

export const onReady = (_match: Match, _lobby: BanchoLobby) => {
  return new MatchPayloadBuilder().startMatch(5).addMessage('glhf!');
};

export const onJoin = (match: Match, _player: BanchoLobbyPlayer) => {
  console.log(`Join Event during ${states[match.state]}!`);
};

export const onPhaseChange = (match: Match, lobby: BanchoLobby) => {
  console.log(`Phase Change Event during ${states[match.state]}!`);
  const payload = new MatchPayloadBuilder();

  if (match.waiting_on == null) {
    payload.setWaitingOn(0);
    match.waiting_on = 0;
  }

  if (
    lobby.teamMode !== match.tournament.team_mode ||
    lobby.winCondition !== match.tournament.score_mode ||
    lobby.size !== warmupSlots
  )
    payload.applySettings(match.tournament.team_mode, match.tournament.score_mode, warmupSlots);

  const team = match.teams[match.waiting_on];

  // If current host is on the team that's warming up, do nothing
  const host = lobby.getHost();
  const user = team.members.find((x) => x.id == host?.user?.id);
  if (user != undefined && user != null) return payload;

  const lobbyIds = lobby.slots.map((x) => x?.user?.id);
  const teamInLobby = team.members.filter((x) => lobbyIds.includes(x.id));
  if (teamInLobby.length > 0) {
    const newHost = teamInLobby[0];
    payload
      .setHost(`#${newHost.id}`)
      .setMods('Freemod')
      .addMessage(
        `${newHost.username} has been selected to choose the warmup for ${team.name}. Use !skip to skip your warmup`,
      )
      .addMessage(`You have ${timers[match.state] / 60} minutes to start the warmup`)
      .setTimer(timers[match.state]);

    return payload;
  }
  return payload.addMessage(`Waiting for ${team.name} to join so they can get the host`);
};

const switchTeams = (match: Match) => {
  const payload = new MatchPayloadBuilder();

  const nextWaitingOn = (match.waiting_on + 1) % match.teams.length;
  payload.setWaitingOn(nextWaitingOn).setTeamWarmedUp(match.teams[match.waiting_on].id, true);

  const team = match.teams[nextWaitingOn];

  if (team.warmed_up) {
    const { team_mode, score_mode } = match.tournament;
    const slots = match.tournament.x_v_x_mode * 2 + 1;
    payload.clearHost().setState(5).applySettings(team_mode, score_mode, slots);
  }
  return payload;
};
