import { BracketMatch } from '../match';

export default class MatchPayloadBuilder {
  state: number | null = null;
  waiting_on: number | null = null;

  messages: string[] = [];
  invite: string[] = [];
  kick: string[] = [];
  moves: BracketMatch.MovePlayer[] = [];
  settings: number[] | null = null;

  name: string | null = null;
  timer: number | null = null;
  aborttimer: boolean | null = null;
  mods: string | null = null;
  map: number | null = null;
  start: number | null = null;
  abort: boolean | null = null;
  host: string | null = null;
  clearhost: boolean | null = null;

  teamWarmUp: { id: number; set: boolean }[] = [];
  teamScore: { id: number; set: number }[] = [];
  teamRoll: { id: number; set: number }[] = [];
  teamPickOrder: { id: number; set: number }[] = [];
  teamBanOrder: { id: number; set: number }[] = [];

  picks: { teamId: number; identifier: string }[] = [];
  bans: { teamId: number; identifier: string }[] = [];
  wins: { teamId: number; identifier: string }[] = [];

  setState(state: number) {
    this.state = state;
    return this;
  }

  setWaitingOn(wo: number) {
    this.waiting_on = wo;
    return this;
  }

  addMessage(msg: string) {
    this.messages.push(msg);
    return this;
  }

  movePlayer(username: string, to: number) {
    this.moves.push({
      username,
      to,
    });
    return this;
  }

  invitePlayer(user: string) {
    this.invite.push(user);
    return this;
  }

  setMods(mods: string) {
    this.mods = mods;
    return this;
  }

  setMap(map: number) {
    this.map = map;
    return this;
  }

  applySettings(team: number, score: number, size: number) {
    if (team > 3 || team < 0) throw 'Team mode must be between 0 and 3';
    if (team > 3 || team < 0) throw 'Score mode must be between 0 and 3';
    if (team > 16 || team < 0) throw 'Size must be between 0 and 16';
    this.settings = [team, score, size];
    return this;
  }

  startMatch(sec?: number) {
    sec = sec ?? 10;
    this.start = sec;
    return this;
  }

  setTimer(sec: number) {
    this.timer = sec;
    return this;
  }

  abortTimer() {
    this.aborttimer = true;
    return this;
  }

  abortMatch() {
    this.abort = true;
    return this;
  }

  setHost(user: string) {
    this.host = user;
    return this;
  }

  clearHost() {
    this.clearhost = true;
    return this;
  }

  setName(name: string) {
    this.name = name;
    return this;
  }

  setTeamWarmedUp(teamId: number, warmedUp: boolean) {
    this.teamWarmUp.push({ id: teamId, set: warmedUp });
    return this;
  }

  setTeamScore(teamId: number, score: number) {
    this.teamScore.push({ id: teamId, set: score });
    return this;
  }

  setTeamRoll(teamId: number, roll: number) {
    this.teamRoll.push({ id: teamId, set: roll });
    return this;
  }

  setTeamPickOrder(teamId: number, order: number) {
    this.teamPickOrder.push({ id: teamId, set: order });
    return this;
  }

  setTeamBanOrder(teamId: number, order: number) {
    this.teamBanOrder.push({ id: teamId, set: order });
    return this;
  }
  addPick(teamId: number, mapIdentifier: string) {
    this.picks.push({ teamId, identifier: mapIdentifier });
    return this;
  }

  addBan(teamId: number, mapIdentifier: string) {
    this.bans.push({ teamId, identifier: mapIdentifier });
    return this;
  }

  addWin(teamId: number, mapIdentifier: string) {
    this.wins.push({ teamId, identifier: mapIdentifier });
    return this;
  }
}
