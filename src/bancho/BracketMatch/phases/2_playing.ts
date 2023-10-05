import { BanchoLobbyPlayer } from 'bancho.js';
import { BracketMatch } from '../match';
import type Match from '../classes/Match';
import { states, timers } from '../config';
import MatchPayloadBuilder from '../classes/MatchPayloadBuilder';

export const onFinish = (match: Match, scores: BracketMatch.Score[]) => {
  const payload = new MatchPayloadBuilder();
  const map = match.picks[match.picks.length - 1];
  const teamScores = [];
  for (const team of match.teams) {
    const a = scores.filter((x) => team.members.find((y) => y.id == x.user.id));
    teamScores.push(a);
  }

  const { score_mode } = match.tournament;

  let sums: number[];
  if (score_mode == 0 || score_mode == 3) {
    sums = sumScores(teamScores);
  }

  payload.addMessage(`${match.teams[0].name} (${sums[0]}) | ${match.teams[1].name} (${sums[1]})`);

  // Check for a tie
  const tieCheck = [...new Set(sums)];
  if (tieCheck.length == 1) {
    return payload.addMessage(`A tie? I guess we have to try that again.`).setState(1);
  }

  const winnerIndex = sums.indexOf(Math.max(...sums));
  const winningTeam = match.teams[winnerIndex];
  payload
    .setTeamScore(winningTeam.id, winningTeam.score + 1)
    .addWin(winningTeam.id, map.identifier);

  winningTeam.score = winningTeam.score + 1;

  const scoreToWin = (match.round.best_of + 1) / 2;

  if (winningTeam.score >= scoreToWin)
    return payload
      .addMessage(`${winningTeam.name} won the match! GGWP!`)
      .addMessage(`The lobby will be closed in ${timers[8]} seconds`)
      .setTimer(timers[8])
      .setState(8);

  const tb = match.teams.map((x) => x.score).filter((x) => x == scoreToWin - 1);
  const tbMap = match.maps.filter((x) => x.identifier.toUpperCase().includes('TB'))[0];

  let mods = tbMap?.mods;
  if (match.tournament.force_nf) {
    mods += mods == '' ? 'NF' : ' NF';
  }
  // TODO: 3TB styled picks
  if (tb.length > 1 && tbMap)
    return payload
      .addMessage("Looks like it's a tie, we're heading into tiebreaker!")
      .setMap(parseInt(tbMap.mapdata.beatmap_id))
      .setMods(mods)
      .addPick(match.teams[0].id, tbMap.identifier)
      .setState(1);

  return payload.setWaitingOn((match.waiting_on + 1) % match.teams.length).setState(0);
};
export const onJoin = (match: Match, player: BanchoLobbyPlayer) => {
  console.log(`Join Event during ${states[match.state]}!`);
};

const sumScores = (scores: BracketMatch.Score[][]) => {
  const sums: number[] = [];
  for (const team of scores) {
    let sum = 0;
    for (const score of team) {
      sum += score.score.score;
    }
    sums.push(sum);
  }
  return sums;
};
