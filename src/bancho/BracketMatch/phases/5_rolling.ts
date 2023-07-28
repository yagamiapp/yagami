import { BanchoLobby, BanchoLobbyPlayer, BanchoUser, ChannelMessage } from "bancho.js"
import type Match from "../classes/Match"
import { states } from "../config";
import MatchPayloadBuilder from "../classes/MatchPayloadBuilder";

// The number represents the number after the !roll, if provided
const rollVerifier = new Map<string, BanchoUser>()

export const onMessage = (match: Match, msg: ChannelMessage) => {
  // Listen for initial roll message
  if (msg.message.toLocaleLowerCase() === "!roll") {
    rollVerifier.set(`${match.id}-${msg.user.ircUsername}`, msg.user)
    return;
  }

  if (msg.user.ircUsername !== "BanchoBot") return;

  const rollMsg = msg.message.match(/(?<username>.+) rolls (?<roll>\d+) point\(s\)/)
  if (!rollMsg) return;

  // Verify User Roll
  const { username, roll } = rollMsg.groups;
  const user = rollVerifier.get(`${match.id}-${username}`)
  if (!user) return;
  rollVerifier.delete(`${match.id}-${username}`)


  // Set team roll
  const team = match.teams.find(x => x.members.map(y => y.id).includes(user.id));
  if (!team || team.roll != null) return;

  const payload = new MatchPayloadBuilder()
    .setTeamRoll(team.id, parseInt(roll))
    .addMessage(`${team.name} rolls ${roll}`)

  match.teams[match.teams.indexOf(team)].roll = parseInt(roll); // Set roll in match object for checking

  // Should I Check for roll winner?
  const teamRolls = match.teams.map(x => x.roll);
  if (teamRolls.includes(null)) return payload;

  // Is there a tie?
  const rolls = [...new Set(teamRolls)]
  if (rolls.length == 1) {
    for (const team of match.teams) {
      payload.setTeamRoll(team.id, 0)
    }
    return payload.addMessage("Wow, a roll tie! Let's try again.")
  }

  // Decide winner
  const winner = teamRolls.indexOf(Math.max(...teamRolls));
  const winningTeam = match.teams[winner];
  return payload
    .setWaitingOn(winner)
    .addMessage(`${winningTeam.name} won the roll!`)
    .setState(6)
}

export const onJoin = (match: Match, player: BanchoLobbyPlayer) => {
  console.log(`Join Event during ${states[match.state]}!`)
}

export const onPhaseChange = (_match: Match, _lobby: BanchoLobby) => {
  return new MatchPayloadBuilder()
    .addMessage("It's time to roll! I'll count the first roll from any player on each team.")
}