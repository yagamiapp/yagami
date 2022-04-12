var admin = require("firebase-admin");
require("dotenv").config();
const { get } = require("./get"),
	{ set } = require("./set"),
	{ push } = require("./push"),
	{ update } = require("./update");
const axios = require("axios").default;

var serviceAccount = {
	type: "service_account",
	project_id: "yagami-aef78",
	private_key_id: process.env.firebasePrivateKeyId,
	private_key: process.env.firebasePrivateKey,
	client_email:
		"firebase-adminsdk-2qxi3@yagami-aef78.iam.gserviceaccount.com",
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

module.exports = {
	getData: async (...reference) => {
		return await get(ref, reference);
	},
	setData: async (data, ...reference) => {
		await set(ref, data, reference);
	},
	pushData: async (data, ...reference) => {
		await push(ref, data, reference);
	},
	updateUser: async (interaction) => {
		await update(interaction);
	},
};
