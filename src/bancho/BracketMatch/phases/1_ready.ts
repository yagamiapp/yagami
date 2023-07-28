import { BanchoLobby, BanchoLobbyPlayer } from "bancho.js"
import type Match from "../classes/Match"
import { allowedFMMods, states, timers } from "../config";
import MatchPayloadBuilder from "../classes/MatchPayloadBuilder";
import Team from "../classes/Team";


export const onReady = async (match: Match, lobby: BanchoLobby) => {
  const payload = new MatchPayloadBuilder();
  const pick = match.picks[match.picks.length - 1]

  // Count Players
  const lobbyPlayerIDs = lobby.slots.filter(x => x).map(x => x.user?.id)
  const lobbyCount: number[] = [];
  for (const team of match.teams) {
    lobbyCount.push(team.members.filter(x => lobbyPlayerIDs.includes(x.id)).length)
  }
  const badTeams: Team[] = [];
  for (const key in lobbyCount) {
    const teamCount = lobbyCount[key];
    if (teamCount != match.tournament.x_v_x_mode) {
      badTeams.push(match.teams[key]);
    }
  }
  if (badTeams.length >= 1) {
    return payload.addMessage(`The following teams do not have enough players: ${badTeams.map(x => x.name).join(", ")}`)
  }

  const freemod = pick.mods
    .toUpperCase()
    .includes("FREEMOD");
  if (freemod) {
    await lobby.updateSettings();
    // Check NF
    if (match.tournament.force_nf) {
      const noNF = [];
      for (const player of lobby.slots) {
        if (!player) continue;

        const nf =
          player.mods.filter((x) => x.shortMod == "nf")
            .length == 0;
        if (nf) {
          noNF.push(player.user.username);
        }
      }

      if (noNF.length > 0) {
        let noNFString = "";
        for (const user of noNF) {
          noNFString +=
            noNFString == "" ? `${user}` : `, ${user}`;
        }
        return payload.addMessage(
          `The following players do not have the NF mod: ${noNFString}`
        )
      }
    }

    // Check Mod Count
    const freemodCount = [];
    for (const team of match.teams) {
      const teamIndex = match.teams.indexOf(team);
      for (const slot of lobby.slots) {
        if (!slot) continue;

        const userMap = team.members.map((x) => x.username);
        if (userMap.includes(slot.user.username)) {
          const modMap = slot.mods.map((x) => x.shortMod);
          if (modMap.some((x) => allowedFMMods.includes(x))) {
            freemodCount[teamIndex] =
              freemodCount[teamIndex] == null
                ? 1
                : freemodCount[teamIndex] + 1;
          }
        }
      }
      if (freemodCount[teamIndex] == null) {
        freemodCount[teamIndex] = 0;
      }
    }

    for (const key in freemodCount) {
      const teamCount = freemodCount[key];
      if (teamCount < match.tournament.fm_mods) {
        badTeams.push(match.teams[key]);
      }
    }

    if (badTeams.length >= 1) {
      const s = match.tournament.fm_mods == 1 ? "" : "s";
      return payload
        .addMessage(
          `The following teams do not meet FM requirements: ${badTeams.map(x => x.name).join(", ")}`
        )
        .addMessage(
          `Teams must have at least ${match.tournament.fm_mods} player${s} with a mod`
        )
    }
  }

  return payload
    .setState(2)
    .startMatch(5)
    .addMessage('glhf!')
}
export const onJoin = (match: Match, player: BanchoLobbyPlayer) => {
  console.log(`Join Event during ${states[match.state]}!`)
}
export const onPhaseChange = (match: Match) => {
  return new MatchPayloadBuilder().setTimer(timers[match.state])
}