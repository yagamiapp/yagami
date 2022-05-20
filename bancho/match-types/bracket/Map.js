const { TournamentMap } = require("../../TournamentMap");

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

		if (mapInMatch.bannedByTeamId != null) {
			this.banned == true;
			let team = match.teams.find(
				(team) => team.id == mapInMatch.bannedByTeamId
			);
			this.bannedBy = team;
		}

		if (mapInMatch.pickedByTeamId != null) {
			this.picked == true;
			let team = match.teams.find(
				(team) => team.id == mapInMatch.bannedByTeamId
			);
			this.pickedBy = team;
		}

		if (mapInMatch.wonByTeamId != null) {
			this.won == true;
			let team = match.teams.find(
				(team) => team.id == mapInMatch.bannedByTeamId
			);
			this.wonBy = team;
		}
	}
}

module.exports.Map = Map;
