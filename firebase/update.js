const { set: setData } = require("./set");
const { get: getData } = require("./get");
require("dotenv").config();

module.exports.update = async (ref, interaction) => {
	let user = await getData(ref, ["users", interaction.user.id]);

	// Cache data for 5 minutes
	if (user == null || user.last_profile_update < Date.now() + 5 * 60 * 1000) {
		return user;
	}

	let userData;
	let discordUserData = interaction.user.toJSON();

	// Clear undefined keys from object
	Object.keys(discordUserData).forEach(
		(key) => discordUserData[key] === undefined && delete discordUserData[key]
	);

	try {
		userData = await axios({
			method: "get",
			url: "https://osu.ppy.sh/api/v2/me/osu",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: "Bearer " + user.access_token.access_token,
			},
		});
	} catch {
		let osuReqBody = {
			client_id: process.env.osuClientId,
			client_secret: process.env.osuClientSecret,
			code: user.access_token.refresh_token,
			grant_type: "authorization_code",
			redirect_uri: process.env.osuRedirectURI,
		};

		let authResponse = await axios({
			method: "post",
			url: "https://osu.ppy.sh/oauth/token",
			data: osuReqBody,
			validateStatus: () => true,
		});

		authResponse = authResponse.data;

		if (authResponse.error) {
			throw "Something is very wrong";
		}

		userData = await axios({
			method: "get",
			url: "https://osu.ppy.sh/api/v2/me/osu",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: "Bearer " + authResponse.access_token,
			},
		});
		userData = userData.data;

		delete userData.page;

		let userPayload = {
			osu: userData,
			discord: discordUserData,
			access_token: authResponse,
			last_profile_update: Date.now(),
		};

		await setData(ref, userPayload, ["users", interaction.user.id]);
	}

	let userPayload = {
		osu: userData.data,
		discord: discordUserData,
		access_token: user.access_token,
		last_profile_update: Date.now(),
	};

	await setData(ref, userPayload, ["users", interaction.user.id]);

	return userPayload;
};
