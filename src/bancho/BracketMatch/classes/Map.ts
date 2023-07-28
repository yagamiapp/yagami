import type Match from "./Match";
import { BracketMatch } from "../match";
import type { MapInPool, Map as MapObj } from "@prisma/client";
import Team from "./Team";

export default class Map {
  mapdata: MapObj;

  match: Match;

  identifier: string;
  mods: string;
  modPriority: number;

  picked: boolean;
  banned: boolean;
  won: boolean;

  picked_by: Team;
  banned_by: Team;
  won_by: Team;

  pickNumber: number;
  pickTeamNumber: number;

  constructor(match: Match, map: BracketMatch.MatchMap) {
    this.mapdata = map.Map.Map;

    this.match = match;

    this.identifier = map.Map.identifier;
    this.mods = map.Map.mods;
    this.modPriority = map.Map.modPriority;

    this.banned = map.bannedByTeamId != null
    this.picked = map.pickedByTeamId != null
    this.won = map.wonByTeamId != null

    if (this.banned) {
      this.banned_by = match.teams.find(team => team.id == map.bannedByTeamId);
    }

    if (this.picked) {
      this.picked_by = match.teams.find(team => team.id == map.pickedByTeamId);
    }

    if (this.won) {
      this.won_by = match.teams.find(team => team.id == map.wonByTeamId);
    }

    this.pickNumber = map.pickNumber;
    this.pickTeamNumber = map.pickTeamNumber;
  }

  toMapInMatch(): BracketMatch.MatchMap {
    return {
      matchId: this.match.id,
      mapIdentifier: this.identifier,
      poolId: this.match.round.mappoolId,
      pickNumber: this.pickNumber,
      pickTeamNumber: this.pickTeamNumber,
      bannedByMatchId: this.banned ? this.match.id : null,
      bannedByTeamId: this.banned ? this.banned_by.id : null,
      pickedByMatchId: this.picked ? this.match.id : null,
      pickedByTeamId: this.picked ? this.picked_by.id : null,
      wonByMatchId: this.won ? this.match.id : null,
      wonByTeamId: this.won ? this.won_by.id : null,
      Map: this.toMapInPool()
    }
  }

  toMapInPool(): MapInPool & { Map: MapObj } {
    return {
      identifier: this.identifier,
      mods: this.mods,
      mapId: this.mapdata.beatmap_id,
      modPriority: this.modPriority,
      mappoolId: this.match.round.mappoolId,
      Map: this.mapdata,
    }
  }
}