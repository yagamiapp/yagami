import { Match, TeamInMatch, MapInMatch, Map, MapInPool, Tournament, Round, Mappool, Team, UserInTeam, User } from '@prisma/client';
import { BanchoLobbyPlayer, BanchoUser } from 'bancho.js';
import type { MultiScore } from 'nodesu';
import type MatchClass from "./classes/Match";

declare namespace BracketMatch {

  type Score = {
    user: BanchoUser;
    score: MultiScore;
  };

  type PlayerJoined = {
    player: BanchoLobbyPlayer;
    slot: number;
    team: string;
  };
  /**
   * MATCH PAYLOAD
   */
  type MovePlayer = {
    username: string;
    to: number;
  };

  type Payload = {
    match_id: number,
    match?: MatchClass;
    movement?: MovePlayer[];
    messages?: string[];
    mp?: {
      invite?: string;
      kick?: string;
      map?: number;
      mods?: string;
      timer?: number;
      start?: number;
      abort?: boolean;
      host?: string;
      clearhost?: boolean;
    };
  };

  /**
   * MATCH OBJECT
   */

  type TeamWithUsers = Team & {
    Members: (UserInTeam & {
      User: User
    })[]
  }

  type MatchRound = Round & {
    Tournament: Tournament;
    mappool: Mappool & {
      Maps: Map[]
    }
  }

  type MatchMap = MapInMatch
    & {
      Map: MapInPool & {
        Map: Map;
      };
    };

  type MatchTeam = TeamInMatch & {
    Team: TeamWithUsers;
    Picks: MatchMap[];
    Bans: MatchMap[];
    Wins: MatchMap[];
  };

  type Data = Match
    & {
      Teams: MatchTeam[];
      Round: MatchRound;
      MapsInMatch: MatchMap[];
    };
}

export { BracketMatch };
