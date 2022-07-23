const { prisma } = require("../../../prisma");

module.exports = {
	async execute(req, res) {
		// Get user in database based on discord id
		if (req.query.u == null || req.query.u == "") {
			res.writeHeader(400);
			res.end();
			return;
		}

		let user = await prisma.user.findFirst({
			where: {
				discord_id: req.query.u,
			},
		});

		// This is required becasue JSON.stringify sucks
		BigInt.prototype.toJSON = function () {
			return this.toString();
		};

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
