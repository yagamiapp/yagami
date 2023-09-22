import { Tournament } from '@prisma/client';
import { BracketMatch } from '../match';
import Map from './Map';
import Round from './Round';
import Team from './Team';

export default class Match {
  id: number;
  message_id: string;
  channel_id: string;
  mp_link: string;
  waiting_on: number;
  round: Round;
  tournament: Tournament;
  maps: Map[] = [];
  state: number;
  teams: Team[] = [];

  picks: Map[] = [];
  bans: Map[] = [];
  wins: Map[] = [];

  scrim: boolean;
  start_time: Date;

  constructor(match: BracketMatch.Data) {
    this.id = match.id;
    this.message_id = match.message_id;
    this.channel_id = match.channel_id;
    this.mp_link = match.mp_link;
    this.waiting_on = match.waiting_on;
    this.state = match.state;
    this.tournament = match.Round.Tournament;

    this.round = new Round(match.Round);

    for (const team of match.Teams) {
      this.teams.push(new Team(team, this));
    }

    for (const mapdata of match.Round.mappool.Maps) {
      const map = new Map(this, mapdata);
      this.maps.push(map);
    }
    for (const mapdata of match.MapsInMatch) {
      const map = this.maps.find(x => x.identifier == mapdata.mapIdentifier);
      if (mapdata.bannedByTeamId) {
        map.banned = true;
        map.banned_by = this.teams.find((team) => team.id == mapdata.bannedByTeamId);
        this.bans.push(map);
      }
      if (mapdata.pickedByTeamId) {
        map.picked = true;
        map.picked_by = this.teams.find((team) => team.id == mapdata.pickedByTeamId);
        this.picks.push(map);
      }
      if (mapdata.wonByTeamId) {
        map.won = true;
        map.won_by = this.teams.find((team) => team.id == mapdata.wonByTeamId);
        this.wins.push(map);
      }
    }
  }

  toDBObject(): BracketMatch.Data {
    return {
      id: this.id,
      message_id: this.message_id,
      channel_id: this.channel_id,
      mp_link: this.mp_link,
      waiting_on: this.waiting_on,
      state: this.state,
      scrim: this.scrim,
      start_time: this.start_time,
      roundId: this.round.id,
      Teams: this.teams.map((team) => team.toDBObject()),
      Round: this.round.toDBObject(),
      MapsInMatch: this.maps.map((map) => map.toMapInMatch()),
    };
  }
}
