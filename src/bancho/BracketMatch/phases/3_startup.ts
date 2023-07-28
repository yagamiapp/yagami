import { BanchoLobby } from "bancho.js";
import MatchPayloadBuilder from "../classes/MatchPayloadBuilder";
import Match from "../classes/Match";
import { states } from "../config";

export const onPhaseChange = async (match: Match, lobby: BanchoLobby) => {
  console.log(`Phase Change Event during ${states[match.state]}!`)
  const payload = new MatchPayloadBuilder()

  for (const team of match.teams) {
    for (const member of team.members) {
      payload.invitePlayer(`#${member.id}`)
    }
  }

  payload
    .setState(4)
    .setName(`${match.tournament.acronym}: (${match.teams[0].name}) vs (${match.teams[1].name})`);
  return payload;
}