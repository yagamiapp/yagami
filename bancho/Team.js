/**
 * A collection of BanchoLobbyUser objects
 */
class Team {
	/**
	 *
	 * @param {import("@prisma/client").Team} team
	 * @param {import("@prisma/client").User[]} users
	 */
	constructor(team, users) {
		this.team = team;
		this.users = users;
		/**
		 * @type {import("bancho.js").BanchoLobbyPlayer[]}
		 */
		this.players = [];
	}
	/**
	 * Compares one team to another based on the score mode
	 * @public
	 * @function
	 * @param {Team} team A second team to compare to
	 * @returns { number } Positive integer if this team "wins", negative if other team "wins"
	 */
	compareTo(team) {
		let thisTeamScore = 0;
		let otherTeamScore = 0;

		this.users.forEach((player) => {
			thisTeamScore += player.score;
		});
		team.users.forEach((player) => {
			thisTeamScore += player.score;
		});

		let scoreDifference = thisTeamScore - otherTeamScore;
		return scoreDifference;
	}

	/**
	 * Writes object to string
	 */
	toString() {
		let outputString = "";
		this.users.forEach((player) => {
			outputString +=
				player.user.ircUsername + ": " + player.score + "; ";
		});
		return outputString;
	}

	getUser(pos) {
		return users[pos];
	}

	getUserPos(id) {
		for (let user of this.users) {
			if (user.osu_id == id) {
				return user;
			}
		}
		return null;
	}
	/**
	 *	Adds a player to the player array
	 * @param {import("bancho.js").BanchoLobbyPlayer} player
	 */
	addPlayer(player) {
		for (let i = 0; i < this.users; i++) {
			let user = this.users[i];
			if (user.osu_id == player.user.id) {
				this.players[i] = player;
			}
		}
	}
}

module.exports.Team = Team;
