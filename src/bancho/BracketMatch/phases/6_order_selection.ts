import { BanchoLobbyPlayer, ChannelMessage } from 'bancho.js';
import type Match from '../classes/Match';
import { states, timers } from '../config';
import MatchPayloadBuilder from '../classes/MatchPayloadBuilder';

export const onMessage = async (match: Match, msg: ChannelMessage) => {
  const payload = new MatchPayloadBuilder();

  // Team Check
  const team = match.teams[match.waiting_on];
  const user = team.members.find((x) => x.id == msg.user.id);
  if (!user) return;

  // Command Check
  const command = msg.message.match(/^!choose (?<order>first|second) (?<type>pick|ban)/);
  if (!command && msg.message.startsWith('!choose')) {
    const typeOption = match.round.bans !== 0 ? '[pick|ban]' : 'pick';
    return payload.addMessage(
      `Invalid command usage! Correct Usage: !choose [first|second] ${typeOption}`,
    );
  }
  if (!command) return;

  const { order, type } = command.groups;
  if (match.round.bans === 0 && type == 'ban')
    return payload.addMessage("There are no bans in this round, so you can't choose the ban order");
  if (type == 'pick' && team.pick_order)
    return payload.addMessage(`The pick order has already been chosen`);
  if (type == 'ban' && team.ban_order)
    return payload.addMessage(`The ban order has already been chosen`);

  const nextWaitingOn = (match.waiting_on + 1) % match.teams.length;
  const nextTeam = match.teams[nextWaitingOn];

  let teamOrder: number;
  let nextTeamOrder: number;
  switch (order) {
    case 'first':
      teamOrder = 1;
      nextTeamOrder = 2;
      break;
    case 'second':
      teamOrder = 2;
      nextTeamOrder = 1;
  }

  if (type == 'pick') {
    payload
      .setTeamPickOrder(team.id, teamOrder)
      .setTeamPickOrder(nextTeam.id, nextTeamOrder)
      .setWaitingOn(nextWaitingOn)
      .setState(6); // Check to continue or resend info message
  } else if (type == 'ban') {
    payload
      .setTeamBanOrder(team.id, teamOrder)
      .setTeamBanOrder(nextTeam.id, nextTeamOrder)
      .setWaitingOn(nextWaitingOn)
      .setState(6); // Check to continue or resend info message
  }

  return payload;
};

export const onJoin = (match: Match, player: BanchoLobbyPlayer) => {
  console.log(`Join Event during ${states[match.state]}!`);
};

export const onPhaseChange = (match: Match) => {
  const team = match.teams[match.waiting_on];

  // Continue Check
  const banOrderChosen = team.ban_order != null || match.round.bans == 0;
  const pickOrderChosen = team.pick_order != null;
  if (banOrderChosen && pickOrderChosen) {
    // Update waiting on for ban phase
    const firstBanner = match.teams[0].ban_order - 1;
    return new MatchPayloadBuilder().setWaitingOn(firstBanner).setState(7);
  }

  const typeOption = match.round.bans !== 0 ? '[pick|ban]' : 'pick';

  return new MatchPayloadBuilder()
    .addMessage(
      `${team.name}, it is your turn to pick! Use "!choose [first|second] ${typeOption}" to choose the order`,
    )
    .setTimer(timers[match.state]);
};
