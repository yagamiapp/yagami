const { prisma } = require("../prisma");

/**
 * A collection of BanchoLobbyUser objects
 */
class Team {
	/**
	 *
	 * @param {import("./MatchManager").MatchManager} match
	 * @param {import("@prisma/client").Team} team
	 * @param {import("@prisma/client").User[]} users
	 */
	constructor(match, team, users) {
		this.match = match;
		this.color = team.color;
		this.icon_url = team.icon_url;
		this.id = team.id;
		this.score = undefined;
		this.name = team.name;
		this.tournamentId = team.tournamentId;
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

		this.players.forEach((player) => {
			thisTeamScore += player.score;
		});
		team.players.forEach((player) => {
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
		this.players.forEach((player) => {
			outputString +=
				player.user.ircUsername + ": " + player.score + "; ";
		});
		return outputString;
	}

	getUser(pos) {
		return this.users[pos];
	}

	getUserPos(id) {
		for (let i = 0; i < this.users.length; i++) {
			let user = this.users[i];
			if (user.osu_id == id) {
				return i;
			}
		}
		// return null;
	}
	/**
	 *	Adds a player to the player array
	 * @param {import("bancho.js").BanchoLobbyPlayer} player
	 */
	addPlayer(player) {
		this.players.push(player);
	}

	async setScore(num) {
		this.score = num;
		await prisma.teamInMatch.update({
			where: {
				team_id_match_id: {
					team_id: this.id,
					match_id: this.match.id,
				},
			},
			data: {
				score: this.score,
			},
		});
	}

	async addScore() {
		this.score++;
		await prisma.teamInMatch.update({
			where: {
				team_id_match_id: {
					team_id: this.id,
					match_id: this.match.id,
				},
			},
			data: {
				score: this.score,
			},
		});
	}
	async setPickOrder(num) {
		this.pick_order = num;
		await prisma.teamInMatch.update({
			where: {
				team_id_match_id: {
					team_id: this.id,
					match_id: this.match.id,
				},
			},
			data: {
				pick_order: num,
			},
		});
	}
	async setBanOrder(num) {
		this.ban_order = num;
		await prisma.teamInMatch.update({
			where: {
				team_id_match_id: {
					team_id: this.id,
					match_id: this.match.id,
				},
			},
			data: {
				ban_order: num,
			},
		});
	}
}

module.exports.Team = Team;
