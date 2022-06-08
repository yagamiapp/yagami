const { prisma } = require("../../../prisma");

class Team {
	/**
	 *
	 * @param {import("./MatchManager").MatchManager} match
	 * @param {import("@prisma/client").Team} team
	 * @param {import("@prisma/client").User[]} users
	 */
	constructor(match, team, users) {
		/**
		 * @type {import("./Match").MatchManager}
		 */
		this.match = match;
		this.color = team.color;
		this.icon_url = team.icon_url;
		this.id = team.id;
		this.score = undefined;
		this.pick_order = undefined;
		this.ban_order = undefined;
		this.name = team.name;
		this.tournamentId = team.tournamentId;
		this.users = users;
		this.picks = [];
		this.bans = [];
		this.wins = [];

		/**
		 * @type {import("bancho.js").BanchoLobbyPlayer[]}
		 */
		this.players = [];
	}
	/**
	 *
	 * @param {import("@prisma/client").TeamInMatch} team
	 */
	async setTeamInMatch(team) {
		this.roll = team.roll;
		this.ban_order = team.ban_order;
		this.pick_order = team.pick_order;
		this.warmed_up = team.warmed_up;
		this.score = team.score;
		this.aborts = team.aborts;
	}
	/**
	 * Compares one team to another based on the score mode
	 * @public
	 * @function
	 * @param {Team} team A second team to compare to
	 * @returns { number } Positive integer if this team "wins", negative if other team "wins"
	 */
	compareTo(team) {
		let teamScore = this.calculateScore(this);
		let otherTeamScore = this.calculateScore(team);
		let scoreDiff = teamScore - otherTeamScore;
		return scoreDiff;
	}

	/**
	 * Calculates the score of the team
	 * @returns
	 */
	calculateScore(team) {
		let users = team.users.map((user) => user.osu_id);
		let scoreSum = 0;
		for (const score of this.match.lastGameData.scores) {
			if (users.includes(parseInt(score.user_id))) {
				// Check score
				if (
					this.match.tournament.score_mode == 0 ||
					this.match.tournament.score_mode == 3
				) {
					scoreSum += parseInt(score.score);
				}

				if (
					this.match.tournament.score_mode == 2 ||
					this.match.tournament.score_mode == 4
				) {
					let accuracy =
						300 * score.count300 +
						100 * score.count100 +
						50 * score.count50;
					let divisor =
						300 *
						(parseInt(score.count300) +
							parseInt(score.count100) +
							parseInt(score.count50) +
							parseInt(score.countmiss));
					accuracy = accuracy / divisor;
					scoreSum += accuracy;
				}
			}
		}
		return scoreSum;
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

	/**
	 *
	 * @param {boolean} b
	 */
	async setWarmedUp(b) {
		this.warmed_up = b;
		await prisma.teamInMatch.update({
			where: {
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
				},
			},
			data: {
				warmed_up: b,
			},
		});
	}

	async setRoll(num) {
		this.roll = num;
		await prisma.teamInMatch.update({
			where: {
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
				},
			},
			data: {
				roll: num,
			},
		});
	}

	async setScore(num) {
		this.score = num;
		await prisma.teamInMatch.update({
			where: {
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
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
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
				},
			},
			data: {
				score: this.score,
			},
		});
	}

	async addAbort() {
		this.aborts++;
		await prisma.teamInMatch.update({
			where: {
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
				},
			},
			data: {
				aborts: this.aborts,
			},
		});
	}

	async setPickOrder(num) {
		this.pick_order = num;
		await prisma.teamInMatch.update({
			where: {
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
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
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
				},
			},
			data: {
				ban_order: num,
			},
		});
	}
	/**
	 *
	 * @param {import("./Map.js").Map} map
	 */
	async addBan(map) {
		this.bans.push(map);
		map.banned = true;
		map.bannedBy = this;
		await prisma.teamInMatch.update({
			where: {
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
				},
			},
			data: {
				Bans: {
					connect: {
						mapIdentifier_matchId: {
							mapIdentifier: map.identifier,
							matchId: this.match.id,
						},
					},
				},
			},
		});
	}
	/**
	 *
	 * @param {import("./Map.js").Map} map
	 */
	async addPick(map) {
		this.picks.push(map);
		map.picked = true;
		map.pickedBy = this;
		if (map.pickNumber == null) {
			map.pickNumber = this.match.picks.length + 1;
			map.pickTeamNumber = this.picks.length + 1;
		}
		await prisma.teamInMatch.update({
			where: {
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
				},
			},
			data: {
				Picks: {
					connect: {
						mapIdentifier_matchId: {
							mapIdentifier: map.identifier,
							matchId: this.match.id,
						},
					},
				},
			},
		});
	}
	/**
	 *
	 * @param {import("./Map.js").Map} map
	 */
	async addWin(map) {
		this.wins.push(map);
		map.won = true;
		map.wonBy = this;
		await prisma.teamInMatch.update({
			where: {
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
				},
			},
			data: {
				Wins: {
					connect: {
						mapIdentifier_matchId: {
							mapIdentifier: map.identifier,
							matchId: this.match.id,
						},
					},
				},
			},
		});
	}
}

module.exports.Team = Team;
