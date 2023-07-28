import { BracketMatch } from "../match";
import type Match from "./Match";
import Map from "./Map";
import { User } from "@prisma/client";

export default class Team {
  match: Match;
  id: number;
  name: string;
  color: string;
  icon_url: string;

  members: User[];
  scrim: boolean;

  score: number;
  roll: number;
  warmed_up: boolean;
  aborts: number;
  faults: number;
  winner: boolean | undefined;
  pick_order: number | undefined;
  ban_order: number | undefined;

  picks: Map[];
  bans: Map[];
  wins: Map[];

  constructor(team: BracketMatch.MatchTeam, match: Match) {
    this.match = match;

    this.id = team.Team.id;
    this.name = team.Team.name;
    this.color = team.Team.color;
    this.icon_url = team.Team.icon_url;

    this.roll = team.roll;
    this.score = team.score;
    this.pick_order = team.pick_order;
    this.ban_order = team.ban_order;
    this.warmed_up = team.warmed_up;
    this.aborts = team.aborts;
    this.faults = team.faults;
    this.winner = team.winner;

    this.members = team.Team.Members.map(x => x.User)
    this.scrim = team.Team.scrim;

    this.picks = [];
    for (const pick of team.Picks) {
      this.picks.push(new Map(match, pick))
    }
    this.bans = [];
    for (const pick of team.Bans) {
      this.bans.push(new Map(match, pick))
    }
    this.wins = [];
    for (const pick of team.Wins) {
      this.wins.push(new Map(match, pick))
    }
  }

  setScore(score: number): typeof this {
    this.score = score;
    return this;
  }
  increaseScore(): typeof this {
    this.score++;
    return this;
  }
  setPickOrder(pick_order: number): typeof this {
    this.pick_order = pick_order;
    return this;
  }
  setBanOrder(ban_order: number): typeof this {
    this.ban_order = ban_order;
    return this;
  }
  toDBObject(): BracketMatch.MatchTeam {
    return {
      matchId: this.match.id,
      teamId: this.id,
      winner: this.winner,
      Team: {
        id: this.id,
        name: this.name,
        color: this.color,
        icon_url: this.icon_url,
        tournamentId: 1,
        scrim: this.scrim,
        Members: this.members.map(x => ({
          User: x,
          osuId: x.id,
          teamId: this.id,
          member_order: this.members.indexOf(x),
          delete_warning: false,
        }))
      },
      roll: this.roll,
      score: this.score,
      pick_order: this.pick_order,
      ban_order: this.ban_order,
      warmed_up: this.warmed_up,
      aborts: this.aborts,
      faults: this.faults,
      Picks: this.picks.map(x => x.toMapInMatch()),
      Bans: this.bans.map(x => x.toMapInMatch()),
      Wins: this.wins.map(x => x.toMapInMatch()),
    }
  }

}