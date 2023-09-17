import type Match from './Match';
import { BracketMatch } from '../match';
import type { MapInPool, Map as MapObj } from '@prisma/client';
import Team from './Team';

export default class Map {
  mapdata: MapObj;

  match: Match;

  identifier: string;
  mods: string;
  modPriority: number;

  picked: boolean | undefined;
  banned: boolean | undefined;
  won: boolean | undefined;

  picked_by: Team | undefined;
  banned_by: Team | undefined;
  won_by: Team | undefined;

  pickNumber: number;
  pickTeamNumber: number;

  constructor(match: Match, map: BracketMatch.MatchMap | BracketMatch.PoolMap) {

    let poolMap: BracketMatch.PoolMap;
    if (isPoolMap(map)) {
      poolMap = map;
    } else {
      poolMap = map.Map;
    }
    this.mapdata = poolMap.Map;

    this.match = match;

    this.identifier = poolMap.identifier;
    this.mods = poolMap.mods;
    this.modPriority = poolMap.modPriority;

    if (isPoolMap(map)) return this;

    this.banned = map.bannedByTeamId != null;
    this.picked = map.pickedByTeamId != null;
    this.won = map.wonByTeamId != null;

    if (this.banned) {
      this.banned_by = match.teams.find((team) => team.id == map.bannedByTeamId);

      // Update properties in mappool list
      // match.maps.find((x) => x.identifier == this.identifier).banned = true;
      // match.maps.find((x) => x.identifier == this.identifier).banned_by = match.teams.find((team) => team.id == map.bannedByTeamId);
    }

    if (this.picked) {
      this.picked_by = match.teams.find((team) => team.id == map.pickedByTeamId);

      // Update properties in mappool list
      // match.maps.find((x) => x.identifier == this.identifier).picked = true;
      // match.maps.find((x) => x.identifier == this.identifier).picked_by = match.teams.find((team) => team.id == map.bannedByTeamId);
    }

    if (this.won) {
      this.won_by = match.teams.find((team) => team.id == map.wonByTeamId);

      // Update properties in mappool list
      // match.maps.find((x) => x.identifier == this.identifier).won = true;
      // match.maps.find((x) => x.identifier == this.identifier).won_by = match.teams.find((team) => team.id == map.bannedByTeamId);
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
      Map: this.toMapInPool(),
    };
  }

  toMapInPool(): MapInPool & { Map: MapObj } {
    return {
      identifier: this.identifier,
      mods: this.mods,
      mapId: this.mapdata.beatmap_id,
      modPriority: this.modPriority,
      mappoolId: this.match.round.mappoolId,
      Map: this.mapdata,
    };
  }
}

const isPoolMap = (map: BracketMatch.MatchMap | BracketMatch.PoolMap): map is BracketMatch.PoolMap => {
  return (map as BracketMatch.PoolMap).identifier != undefined;
}