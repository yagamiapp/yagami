import { BanchoLobby } from "bancho.js";
import Match from "../classes/Match";
import MatchPayloadBuilder from "../classes/MatchPayloadBuilder";

export const onTimerEnd = (match: Match, lobby: BanchoLobby) => {
  return new MatchPayloadBuilder()
    .setState(9)
    .close()
}