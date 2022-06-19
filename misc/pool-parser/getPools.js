const fs = require("fs");
const axios = require("axios").default;

async function main() {
	let req = await axios({
		baseURL:
			"https://script.google.com/macros/s/AKfycbx1cuzkiNDl3zDZ4aFx6bwgVSCety5M99UQvjDFvmaPnI72IrFdPlU9gh3FHPQ0Rq-FnQ/exec",
		timeout: 0,
		method: "GET",
	});

	console.log(req.data);

	fs.writeFileSync(
		"./misc/pool-parser/rawpools.json",
		JSON.stringify(req.data)
	);
}

main();
