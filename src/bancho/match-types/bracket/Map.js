const { TournamentMap } = require('../../TournamentMap');

class Map extends TournamentMap {
  /**
   *
   * @param {import("./Match").MatchManager} match
   * @param {import("@prisma/client").Map} map
   * @param {import("@prisma/client").MapInMatch} mapInMatch
   */
  constructor(match, map, mapInMatch) {
    super(map);

    this.match = match;
    this.banned = false;
    this.picked = false;
    this.won = false;

    this.pickNumber = mapInMatch.pickNumber;
    this.pickTeamNumber = mapInMatch.pickTeamNumber;

    if (mapInMatch.bannedByTeamId != null) {
      this.banned = true;
      let team = match.teams.find((team) => team.id == mapInMatch.bannedByTeamId);
      /**
       * @type {import("./Team").Team}
       */
      this.bannedBy = team;
    }

    if (mapInMatch.pickedByTeamId != null) {
      this.picked = true;
      let team = match.teams.find((team) => team.id == mapInMatch.pickedByTeamId);
      /**
       * @type {import("./Team").Team}
       */
      this.pickedBy = team;
    }

    if (mapInMatch.wonByTeamId != null) {
      this.won = true;
      let team = match.teams.find((team) => team.id == mapInMatch.wonByTeamId);
      /**
       * @type {import("./Team").Team}
       */
      this.wonBy = team;
    }
  }
}

module.exports.Map = Map;
