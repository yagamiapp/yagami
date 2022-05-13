const { prisma } = require("../prisma");

// There's currently a bug with local SQLite
// Databases, where too many requests in
// Succession will crash prisma.
let prismaTimeout = 300;

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
		this.pick_order = undefined;
		this.ban_order = undefined;
		this.name = team.name;
		this.tournamentId = team.tournamentId;
		this.users = users;
		this.bans = [];
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
		this.warmedUp = team.warmedUp;
		this.score = team.score;
		let bans = await prisma.mapInMatch.findMany({
			where: {
				matchId: this.match.id,
				bannedByTeamId: this.id,
			},
		});
		bans = bans.map((map) => map.mapIdentifier);
		this.bans = bans;

		let picks = await prisma.mapInMatch.findMany({
			where: {
				matchId: this.match.id,
				pickedByTeamId: this.id,
			},
		});
		picks = picks.map((map) => map.mapIdentifier);
		this.picks = picks;

		let wins = await prisma.mapInMatch.findMany({
			where: {
				matchId: this.match.id,
				wonByTeamId: this.id,
			},
		});
		wins = wins.map((map) => map.mapIdentifier);
		this.wins = wins;
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
		console.log(`${teamScore} - ${otherTeamScore}`);
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
					scoreSum += score.score;
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
		this.warmedUp = b;
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
		await prisma.teamInMatch.update({
			where: {
				teamId_matchId: {
					teamId: this.id,
					matchId: this.match.id,
				},
			},
			data: {
				warmedUp: b,
			},
		});
	}

	async setRoll(num) {
		this.roll = num;
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
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
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
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
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
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
	async setPickOrder(num) {
		this.pick_order = num;
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
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
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
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
	async addBan(id) {
		this.bans.push(id);
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
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
							mapIdentifier: id,
							matchId: this.match.id,
						},
					},
				},
			},
		});
	}

	async addPick(id) {
		this.picks.push(id);
		console.log(id);
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
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
							mapIdentifier: id,
							matchId: this.match.id,
						},
					},
				},
			},
		});
	}
	async addWin(id) {
		this.wins.push(id);
		console.log(id);
		await new Promise((resolve) => setTimeout(resolve, prismaTimeout));
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
							mapIdentifier: id,
							matchId: this.match.id,
						},
					},
				},
			},
		});
	}
}

module.exports.Team = Team;
