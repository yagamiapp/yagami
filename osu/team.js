/**
 * A collection of BanchoLobbyUser objects
 */

const { BanchoLobbyPlayer, BanchoLobbyPlayerScore } = require("bancho.js");

/**
 *
 */
class Team {
	/**
	 * @constructor
	 * @param  {...BanchoLobbyPlayer} players A list of players on the team
	 */
	constructor(...players) {
		this.players = players;
	}
	/**
	 * @desc Used to compare scores to another team
	 * @public
	 * @function
	 * @param {Team} team A second team to compare the scores to
	 * @returns { number } An Integer (1 if given tram's score is lower, -1 if given team's score is higher)
	 */
	compareTo(team) {
		let thisTeamScore = 0;
		let otherTeamScore = 0;

		this.players.forEach((player) => {
			thisTeamScore += player.score;
		});
		team.players.forEach((player) => {
			thisTeamScore += player.score;
		});

		let scoreDifference = thisTeamScore - otherTeamScore;

		return Math.sign(scoreDifference);
	}

	/**
	 * Writes object to string
	 */
	toString() {
		let outputString = "";
		this.players.forEach((player) => {
			outputString +=
				player.user.ircUsername + ": " + player.score + "; ";
		});
		return outputString;
	}
}

module.exports.Team = Team;
