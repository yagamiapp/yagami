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
  async refreshTokens() {
    let users = await prisma.user.findMany();
    let ratelimit = false;
    for (const user of users) {
      if (ratelimit) continue;
      let ratelimitUpdate = await refreshOsuToken(user);
      ratelimit = ratelimit || ratelimitUpdate;
    }
  },
};

/**
 *
 * @param {import("@prisma/client").User} user
 */
async function refreshOsuToken(user, force) {
  force = true;
  let token = await prisma.osuOauth.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!token) {
    console.log(`${user.username} has no token`);
    return;
  }

  force = force || false;
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
        client_id: process.env.OSU_CLIENT_ID,
        client_secret: process.env.OSU_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refresh_token,
      },
      validateStatus: () => true,
    });

    // If the refresh token did not work, it means the user revoked the client's access.
    // In this case, we just sign the user out of all sessions, and wait for them to log in
    // and give us an updated token.
    if (!response.data.access_token) {
      console.log(`${user.username}'s refresh token has expired!`);
      await prisma.userSession.deleteMany({
        where: {
          osuId: user.id,
        },
      });
      await prisma.osuOauth.delete({
        where: {
          userId: user.id,
        },
      });
      return;
    }

    let { access_token, expires_in, refresh_token, token_type } = response.data;

    await prisma.osuOauth.update({
      where: {
        userId: user.id,
      },
      data: {
        access_token,
        expires_in,
        refresh_token,
        token_type: token_type,
        last_update: new Date(),
      },
    });

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
        id: userData.id,
      },
      data: userPayload,
    });

    setTimeout(refreshOsuToken, expires_in * 1000, user);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } else {
    console.log(
      `Data for ${user.username} is up to date! (https://osu.ppy.sh/u/${user.id})`
    );
    setTimeout(refreshOsuToken, time, user);
  }
}
