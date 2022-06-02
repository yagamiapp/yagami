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
	 * @param {import("@prisma/client").OsuOauth} token
	 */
	async refreshOsuToken(token, force) {
		let refreshTime = token.last_update.getTime() + token.expires_in * 1000;
		let time = refreshTime - Date.now();
		if (time <= 0 || force) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			let response = await axios({
				method: "POST",
				url: "https://osu.ppy.sh/oauth/token",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				data: {
					client_id: process.env.osuClientId,
					client_secret: process.env.osuClientSecret,
					grant_type: "refresh_token",
					refresh_token: token.refresh_token,
				},
				validateStatus: () => true,
			});

			if (response.error) {
				console.log(response.error);
				return;
			}

			let { access_token, expires_in, refresh_token, token_type } =
				response.data;

			token = await prisma.osuOauth.update({
				where: {
					discord_id: token.discord_id,
				},
				data: {
					access_token,
					expires_in,
					refresh_token,
					type: token_type,
					last_update: new Date(),
				},
			});
			setTimeout(
				module.exports.refreshOsuToken,
				expires_in * 1000,
				token
			);
		} else {
			setTimeout(module.exports.refreshOsuToken, time, token);
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
		let userData = await axios({
			method: "get",
			url: "https://osu.ppy.sh/api/v2/me/osu",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: "Bearer " + token.access_token,
			},
			validateStatus: () => true,
		});

		if (userData.error) {
			console.log(userData.error);
			return;
		}

		if (userData.status == 429) {
			console.log("Ratelimited");
			return;
		}

		userData = userData.data;
		console.log("User Data", userData);

		if (userData.authentication == "basic") {
			module.exports.refreshOsuToken(token, true);
			return;
		}

		let userPayload = {
			osu_id: userData.id,
			osu_username: userData.username,
			osu_country_code: userData.country.code,
			osu_country_name: userData.country.name,
			osu_cover_url: userData.cover_url,
			osu_ranked_score: userData.statistics.ranked_score,
			osu_play_count: userData.statistics.play_count,
			osu_total_score: userData.statistics.total_score,
			osu_pp_rank: userData.statistics.global_rank ?? -1,
			osu_level: userData.statistics.level.current,
			osu_level_progress: userData.statistics.level.progress,
			osu_hit_accuracy: userData.statistics.hit_accuracy,
			osu_pp: userData.statistics.pp,
		};

		await prisma.user.update({
			where: {
				discord_id: token.discord_id,
			},
			data: userPayload,
		});
	},
	async refreshTokens() {
		let osuTokens = await prisma.osuOauth.findMany();
		for (const token of osuTokens) {
			await new Promise((resolve) => setTimeout(resolve, 2000));
			await module.exports.refreshOsuToken(token);
		}
	},
};
