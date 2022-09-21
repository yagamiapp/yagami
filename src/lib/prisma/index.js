const prismaClientBuilder = require("@prisma/client");
const prisma = new prismaClientBuilder.PrismaClient();
const axios = require("axios").default;
module.exports = {
	prisma,
	/**
	 * Fetches a guild from the database
	 * @param {number} id The id of a guild
	 */
	async fetchGuild(id) {
		let guild = await prisma.guild.findFirst({
			where: {
				guild_id: id,
			},
		});
		let tournaments = await prisma.tournament.findMany({
			where: {
				Guild_id: id,
			},
		});
		guild.tournaments = tournaments;
		tournaments.forEach((tournament) => {
			if (tournament.id == guild.active_tournament)
				guild.active_tournament = tournament;
		});
		return guild;
	},
	/**
	 *
	 * @param {import("@prisma/client").User} user
	 */
	async refreshOsuToken(user, force) {
		let refreshTime = user.last_update.getTime() + user.expires_in * 1000;
		let time = refreshTime - Date.now();
		if (time <= 0 || force) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			console.log(`Refreshing osu token...`);

			let response = await axios({
				method: "POST",
				url: "https://osu.ppy.sh/oauth/token",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				data: {
					client_id: process.env.OSU_CLIENT_ID,
					client_secret: process.env.OSU_CLIENT_SECRET,
					grant_type: "refresh_token",
					refresh_token: user.refresh_token,
				},
				validateStatus: () => true,
			});

			if (response.error) {
				console.log(response.error);
				return;
			}

			let { access_token, expires_in, refresh_token, token_type } =
				response.data;

			user = await prisma.user.update({
				where: {
					id: user.id,
				},
				data: {
					access_token,
					expires_in,
					refresh_token,
					type: token_type,
					last_update: new Date(),
				},
			});
			setTimeout(module.exports.refreshOsuToken, expires_in * 1000, user);
		} else {
			setTimeout(module.exports.refreshOsuToken, time, user);
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
		let userData = await axios({
			method: "get",
			url: "https://osu.ppy.sh/api/v2/me/osu",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: "Bearer " + user.access_token,
			},
			validateStatus: () => true,
		});

		if (userData.status == 429) {
			console.log("Ratelimited");
			return true;
		}

		if (userData.error) {
			console.log(userData.error);
			return;
		}

		userData = userData.data;

		if (userData.authentication == "basic") {
			return;
		}
		console.log(
			`Refreshing user data for ${userData.username} (https://osu.ppy.sh/u/${userData.id})`
		);
		let userPayload = {
			id: userData.id,
			username: userData.username,
			country_code: userData.country.code,
			country_name: userData.country.name,
			cover_url: userData.cover_url,
			ranked_score: userData.statistics.ranked_score,
			play_count: userData.statistics.play_count,
			total_score: userData.statistics.total_score,
			pp_rank: userData.statistics.global_rank ?? -1,
			level: userData.statistics.level.current,
			level_progress: userData.statistics.level.progress,
			hit_accuracy: userData.statistics.hit_accuracy,
			pp: userData.statistics.pp,
		};

		await prisma.user.update({
			where: {
				discord_id: user.discord_id,
			},
			data: userPayload,
		});
	},
	async refreshTokens() {
		let users = await prisma.user.findMany();
		let ratelimit = false;
		for (const user of users) {
			if (ratelimit) continue;
			await new Promise((resolve) => setTimeout(resolve, 2000));
			let ratelimitUpdate = await module.exports.refreshOsuToken(user);
			ratelimit = ratelimit || ratelimitUpdate;
		}
	},
};
