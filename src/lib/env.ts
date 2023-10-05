const {
  BANCHO_USERNAME,
  BANCHO_PASSWORD,
  BANCHO_API_KEY,
  OSU_CLIENT_ID,
  OSU_CLIENT_SECRET,
  DISCORD_CLIENT_ID,
  DISCORD_TOKEN,
  DATABASE_URL,
} = process.env;

export default {
  bancho: {
    username: BANCHO_USERNAME,
    password: BANCHO_PASSWORD,
    apiKey: BANCHO_API_KEY,
  },
  osu: {
    client_id: OSU_CLIENT_ID,
    client_secret: OSU_CLIENT_SECRET,
  },
  discord: {
    client_id: DISCORD_CLIENT_ID,
    token: DISCORD_TOKEN,
  },
  database_url: DATABASE_URL,
};
