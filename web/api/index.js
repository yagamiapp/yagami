// Endpoint file handler
const fs = require("fs");

let endpoints = {};
let endpointFiles = fs
	.readdirSync("./web/api/endpoints")
	.filter((file) => file.endsWith(".js"));

endpointFiles.forEach((element) => {
	let endpoint = require("./endpoints/" + element);
	endpoints[endpoint.endpoint] = endpoint;
});

module.exports = {
	async execute(endpoint, req, res) {
		// Get file based on endpoint and call execute function
		try {
			let command = endpoints[endpoint];
			if (!command) return;
			await command.execute(req, res);
		} catch (e) {
			res.writeHead(500);
			res.write("We encountered an error:" + e);
			res.end();
			return;
		}
	},
};
