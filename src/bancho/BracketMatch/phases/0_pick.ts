import { BanchoLobbyPlayer, ChannelMessage } from "bancho.js"
import type Match from "../classes/Match"
import { states, timers } from "../config";
import MatchPayloadBuilder from "../classes/MatchPayloadBuilder";


export const onMessage = (match: Match, msg: ChannelMessage) => {
  const payload = new MatchPayloadBuilder();
  const listCommand = msg.message.match(/^!list/);
  if (listCommand) {
    const pickList = getAvailablePicks(match)
    const message = `Available Picks: ${pickList.available.map(x => x.identifier).join(", ")}`
    return payload.addMessage(message)
  }

  const bansCommand = msg.message.match(/^!bans/);
  if (bansCommand) {
    const message = `Bans by ${match.teams[0].name}: ${match.teams[0].bans.map(x => x.identifier).join(", ")}`
    const message2 = `Bans by ${match.teams[1].name}: ${match.teams[1].bans.map(x => x.identifier).join(", ")}`
    return payload.addMessage(`${message} -- ${message2}`)
  }

  // Team Check
  const team = match.teams[match.waiting_on];
  const user = team.members.find(x => x.id == msg.user.id);
  if (!user) return;

  const command = msg.message.match(/^!pick (?<map>\w+)/);
  if (!command) return;

  const mapIdentifier = command.groups.map.toUpperCase();
  const map = match.maps.find(x => x.identifier.toUpperCase() == mapIdentifier)
  if (!map) return payload.addMessage(`${mapIdentifier} is not a map in the pool`)

  const pickList = getAvailablePicks(match);
  if (pickList.available.includes(map)) {
    const { beatmap_id, artist, title, version, beatmapset_id } = map.mapdata;
    let mods = map.mods;
    if (match.tournament.force_nf) {
      mods += (mods == "" ? "NF" : " NF")
    }
    return payload
      .addPick(team.id, map.identifier)
      .setMods(mods)
      .setMap(parseInt(beatmap_id))
      .addMessage(`${team.name} chooses ${map.identifier} | [https://osu.ppy.sh/b/${beatmap_id} ${artist} - ${title} [${version}]] - [https://beatconnect.io/b/${beatmapset_id} Beatconnect Mirror] - [https://api.chimu.moe/v1/download/${beatmapset_id} chimu.moe Mirror]`)
      .setState(1)
  }

  if (pickList.banned.includes(map)) return payload
    .addMessage(`${map.identifier} was chosen as a ban`)

  if (pickList.tb.includes(map)) return payload
    .addMessage(`Silly Goose! You can't pick the tiebreaker!`)

  if (pickList.doublePicks && pickList.doublePicks.includes(map)) return payload
    .addMessage(`You cannot pick from the same modpool twice in a row`)


  // Other Exception message
  return payload.addMessage(`${map.identifier} is not in the list of available bans`)
}

export const onJoin = (match: Match, player: BanchoLobbyPlayer) => {
  console.log(`Join Event during ${states[match.state]}!`)
}

export const onPhaseChange = (match: Match) => {
  const team = match.teams[match.waiting_on];
  const payload = new MatchPayloadBuilder();

  let bestOfPhrase = `Best Of ${match.round.best_of}`
  if (team.score >= (match.round.best_of - 1) / 2) bestOfPhrase = `Match Point: ${team.name}`

  return payload
    .addMessage(`${match.teams[0].name} | ${match.teams[0].score} - ${match.teams[1].score} | ${match.teams[1].name} // ${bestOfPhrase} // Next pick: ${team.name}`)
    .addMessage(`Use !pick [map] to select your pick, or !list to view all picks`)
    .setTimer(timers[match.state])
}

const getAvailablePicks = (match: Match) => {
  const picked = match.maps.filter(x => x.picked)
  const banned = match.maps.filter(x => x.banned)
  const won = match.maps.filter(x => x.won)
  const tb = match.maps.filter(x => x.identifier.toUpperCase().includes("TB"));

  let availablePicks = match.maps
    .filter(x => !picked.includes(x))
    .filter(x => !banned.includes(x))
    .filter(x => !won.includes(x))
    .filter(x => !tb.includes(x))

  const { double_pick } = match.tournament
  if (double_pick == 2) return {
    available: availablePicks,
    picked,
    banned,
    won,
    tb
  }

  // Remove double pick options
  const pickingTeam = match.teams[match.waiting_on];
  const lastPick = pickingTeam.picks[pickingTeam.picks.length - 1];
  if (!lastPick) return {
    available: availablePicks,
    picked,
    banned,
    won,
    tb
  }
  let doublePicks = match.maps.filter(x => lastPick.mods == x.mods);
  if (double_pick == 1) doublePicks = doublePicks.filter(x => x.mods != ""); // Remove NM

  availablePicks = availablePicks.filter(x => !doublePicks.includes(x));

  return {
    available: availablePicks,
    picked,
    banned,
    won,
    tb,
    doublePicks
  }
}