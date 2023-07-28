import { Tournament } from '@prisma/client';
import { BracketMatch } from '../match';
import Map from './Map';

export default class Round {
  id: number;
  name: string;
  acronym: string;
  bans: number;
  best_of: number;
  tournament: Tournament;
  show_mappool: boolean;
  mappoolId: number;
  mappool: Map[];
  mappoolGlobal: boolean;

  constructor(round: BracketMatch.MatchRound) {
    this.id = round.id;
    this.name = round.name;
    this.acronym = round.acronym;
    this.bans = round.bans;
    this.best_of = round.best_of;
    this.tournament = round.Tournament;
    this.show_mappool = round.show_mappool;
    this.mappoolId = round.mappool.id;
    this.mappoolGlobal = round.mappool.global;
  }

  toDBObject(): BracketMatch.MatchRound {
    return {
      id: this.id,
      name: this.name,
      acronym: this.acronym,
      bans: this.bans,
      best_of: this.best_of,
      tournamentId: this.tournament.id,
      show_mappool: this.show_mappool,
      mappoolId: this.mappoolId,
      delete_warning: 'false',
      Tournament: this.tournament,
      mappool: {
        id: this.mappoolId,
        global: this.mappoolGlobal,
        tournament_acronym: this.tournament.acronym,
        tournament_name: this.tournament.name,
        tournament_iteration: `${new Date().getFullYear()}`,
        round_acronym: this.acronym,
        round_name: this.name,
        Maps: this.mappool.map((x) => x.mapdata),
      },
    };
  }
}
