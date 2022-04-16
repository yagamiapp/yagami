const { getData } = require("../../../firebase");

module.exports = {
	async execute(req, res) {
		// Get user in database based on discord id
		if (req.query.u == null || req.query.u == "") {
			res.writeHeader(400);
			res.end();
			return;
		}
		let user = await getData("users", req.query.u);

		if (user == null) {
			res.writeHeader(400);
			res.end();
			return;
		}

		delete user.access_token;

		res.setHeader("Content-Type", "application/json");
		res.writeHead(200);
		res.write(JSON.stringify(user));
		res.end();
	},
	endpoint: "get_user",
};
