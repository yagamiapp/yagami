var admin = require("firebase-admin");
require("dotenv").config();

class FirebaseManager {
	constructor() {
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
	}
	async getData(...reference) {
		let data;
		let currentRef = ref;
		for (let i = 0; i < reference.length; i++) {
			currentRef = currentRef.child(reference[i]);
		}

		await currentRef.once("value", (val) => {
			data = val.val();
		});
		return data;
	}

	async setData(data, ...reference) {
		let currentRef = ref;
		for (let i = 0; i < reference.length; i++) {
			currentRef = currentRef.child(reference[i]);
		}

		currentRef.set(data);
	}

	async pushData(data, ...reference) {
		let oldData;
		let currentRef = ref;

		for (let i = 0; i < reference.length; i++) {
			currentRef = currentRef.child(reference[i]);
		}

		await currentRef.once("value", (val) => {
			oldData = val.val();
		});

		oldData.push(data);

		currentRef.set(oldData);
	}
}

module.exports.FirebaseManager = FirebaseManager;
