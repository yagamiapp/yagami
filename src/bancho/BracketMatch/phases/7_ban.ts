import { BanchoLobbyPlayer, ChannelMessage } from 'bancho.js';
import type Match from '../classes/Match';
import { states, timers } from '../config';
import MatchPayloadBuilder from '../classes/MatchPayloadBuilder';

export const onMessage = (match: Match, msg: ChannelMessage) => {
  const payload = new MatchPayloadBuilder();
  const listCommand = msg.message.match(/^!list/);
  if (listCommand) {
    const banList = getAvailableBans(match);
    const message = `Available Bans: ${banList.available.map((x) => x.identifier).join(', ')}`;
    return payload.addMessage(message);
  }

  // Team Check
  const team = match.teams[match.waiting_on];
  const user = team.members.find((x) => x.id == msg.user.id);
  if (!user) return;

  const command = msg.message.match(/!ban (?<map>\w+)/);
  if (!command) return;

  const mapIdentifier = command.groups.map.toUpperCase();
  const map = match.maps.find((x) => x.identifier.toUpperCase() == mapIdentifier);
  if (!map) return payload.addMessage(`${mapIdentifier} is not a map in the pool`);

  const banList = getAvailableBans(match);
  if (banList.available.includes(map))
    return payload
      .addBan(team.id, map.identifier)
      .addMessage(`${team.name} chooses to ban ${map.identifier}`)
      .setWaitingOn((match.waiting_on + 1) % match.teams.length)
      .setState(7); // Rerun ban phase

  if (banList.banned.includes(map))
    return payload.addMessage(`${map.identifier} has already been chosen as a ban`);

  if (banList.tb.includes(map))
    return payload.addMessage(`Silly Goose! You can't ban the tiebreaker!`);

  if (banList.doubleBans && banList.doubleBans.includes(map))
    return payload.addMessage(`You cannot ban from the same modpool more than once`);

  // Other Exception message
  return payload.addMessage(`${map.identifier} is not in the list of available bans`);
};

export const onJoin = (match: Match, player: BanchoLobbyPlayer) => {
  console.log(`Join Event during ${states[match.state]}!`);
};

export const onPhaseChange = (match: Match) => {
  const team = match.teams[match.waiting_on];
  const payload = new MatchPayloadBuilder();

  if (team.bans.length >= match.round.bans) {
    const firstPicker = match.teams[0].pick_order - 1;
    return payload.setWaitingOn(firstPicker).setState(0);
  }

  const banOpportunities = match.round.bans - team.bans.length;
  return payload
    .addMessage(`${team.name}, It's your turn to ban. Use !ban [map] to ban a map!`)
    .addMessage(
      `You have ${banOpportunities} ban${banOpportunities == 1 ? 's' : ''
      } left, use !list to see the available bans!`,
    )
    .setTimer(timers[match.state]);
};

const getAvailableBans = (match: Match) => {
  const picked = match.picks;
  const banned = match.bans;
  const tb = match.maps.filter((x) => x.identifier.toUpperCase().includes('TB'));

  let availableBans = match.maps
    .filter((x) => !picked.includes(x))
    .filter((x) => !banned.includes(x))
    .filter((x) => !tb.includes(x));

  const { double_ban } = match.tournament;
  if (double_ban == 2)
    return {
      available: availableBans,
      picked,
      banned,
      tb,
    };

  // Remove double ban options
  const banningTeam = match.teams[match.waiting_on];
  const otherBans = match.maps.filter((x) => x.banned_by?.id == banningTeam.id);
  const otherBanMods = otherBans.map((x) => x.mods);
  let doubleBans = match.maps.filter((x) => otherBanMods.includes(x.mods));
  if (double_ban == 1) doubleBans = doubleBans.filter((x) => x.mods != ''); // Remove NM

  availableBans = availableBans.filter((x) => !doubleBans.includes(x));

  return {
    available: availableBans,
    picked,
    banned,
    tb,
    doubleBans,
  };
};
