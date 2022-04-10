var admin = require("firebase-admin");
require("dotenv").config();
const axios = require("axios").default;

var serviceAccount = {
	type: "service_account",
	project_id: "yagami-aef78",
	private_key_id: process.env.firebasePrivateKeyId,
	private_key: process.env.firebasePrivateKey,
	client_email: "firebase-adminsdk-2qxi3@yagami-aef78.iam.gserviceaccount.com",
	client_id: process.env.firebaseClientId,
	auth_uri: "https://accounts.google.com/o/oauth2/auth",
	token_uri: "https://oauth2.googleapis.com/token",
	auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
	client_x509_cert_url:
		"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-2qxi3%40yagami-aef78.iam.gserviceaccount.com",
};

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://yagami-aef78-default-rtdb.firebaseio.com",
});

const db = admin.database();
const ref = db.ref();

module.exports.getData = async (...reference) => {
	let data;
	let currentRef = ref;
	for (let i = 0; i < reference.length; i++) {
		currentRef = currentRef.child(reference[i]);
	}

	await currentRef.once("value", (val) => {
		data = val.val();
	});
	return data;
};

module.exports.setData = async (data, ...reference) => {
	let currentRef = ref;
	for (let i = 0; i < reference.length; i++) {
		currentRef = currentRef.child(reference[i]);
	}

	currentRef.set(data);
};

module.exports.pushData = async (data, ...reference) => {
	let oldData;
	let currentRef = ref;

	for (let i = 0; i < reference.length; i++) {
		currentRef = currentRef.child(reference[i]);
	}

	await currentRef.once("value", (val) => {
		oldData = val.val();
	});

	if (oldData == null) {
		currentRef.set([data]);
		return;
	}

	oldData.push(data);
	currentRef.set(oldData);
};

module.exports.updateUser = async (interaction) => {
	let user = await this.getData("users", interaction.user.id);

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

		let userPayload = {
			osu: userData,
			discord: discordUserData,
			access_token: authResponse,
			last_profile_update: Date.now(),
		};

		await this.setData(userPayload, "users", interaction.user.id);
	}

	let userPayload = {
		osu: userData.data,
		discord: discordUserData,
		access_token: user.access_token,
		last_profile_update: Date.now(),
	};

	await this.setData(userPayload, "users", interaction.user.id);

	return userPayload;
};
