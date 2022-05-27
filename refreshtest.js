let axios = require("axios").default;
// Basic HTTP request:
let url = "https://osu.ppy.sh/oauth/token";

let data = {
	client_id: 14803,
	client_secret: "TstEP2N9nxwVsQcv9QgYZtW6OxTldUips3lgiKep",
	refresh_token:
		"def502000ea05182fa18eab0f56f5856dad333bcabf81abe580798b10f3bf86943354a7a12a32676c96baa2b5bddcd361303b9b43e38fca6b6c027f97b65e08cb40b7baaecf8dd3874f542f3e42daaa55d5d974f411d9d2475cb206fcf108ee484962ac174b62fec57af830d6a7194ee6b5fdceb1f143fe739bc8ade9e4ffb2ea3fbac5c554d2c6ca790b5e1f4fb634b8f7bf314fbd464e2043ac60e9c4408585584a395ad7488d19b3eb2c712e61ce17fc9e9984f94c0b8a438360dec6f41507a2633f9b14524767e17bd87295c1e4be87b746e73a2af83c6c9839352929f53e72f615b02d812cad13da47529ff5d4d5b174eb83358535d74f567639a9ab14ad69ff222f9fb4a38a64ea733ed22a7736c2d1b3bd71c82231fad0ca7c89d3f511136d5338b954e8a1eae37c3e1686a858865e915f1cad9822cd29e5d42683aa2c57ae69f6619264e88e3a7c392864aa364f63b0c6af8aa8836c00c174080ff47d9c5578593315d6f4fbc8f19f235208c7a339acd9638",
	grant_type: "refresh_token",
	redirect_uri: "http://localhost:3000/auth/",
};

let headers = {
	"Content-Type": "application/json",
	Accept: "application/json",
};

async function fetchData() {
	try {
		let response = await axios({
			method: "post",
			url,
			data: JSON.stringify(data),
			headers,
			validateStatus: () => true,
		});

		console.log(response.data);
	} catch (e) {
		console.log(e.toJSON());
	}
}

fetchData();
