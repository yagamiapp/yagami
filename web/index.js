const express = require("express");
const { rateLimit } = require("express-rate-limit");
const app = express();
const auth = require("./auth");
const crypto = require("crypto");
const path = require("path");
const redirects = require("./redirects.json");
const api = require("./api");
const PORT = process.env.PORT | 3000;
const pm2 = require("pm2");

module.exports.init = () => {
	const limiter = rateLimit({
		windowMs: 30 * 1000,
		max: 15,
		standardHeaders: true,
		legacyHeaders: false,
	});

	// Apply the rate limiting middleware to all requests
	app.use(limiter);

	app.use(express.json());

	app.get("/auth", (req, res) => {
		// lgtm [js/missing-rate-limiting]
		auth.authUser(req.query, req, res);
	});

	app.post("/reload", (req, res) => {
		// lgtm [js/missing-rate-limiting]

		// Check github secret hash
		var hmac = crypto.createHmac("sha256", process.env.GITHUB_SECRET);
		hmac.update(JSON.stringify(req.body), "utf-8");

		var xub = "X-Hub-Signature-256";
		var received = req.headers[xub] || req.headers[xub.toLowerCase()];
		var expected = "sha256=" + hmac.digest("hex");

		if (received != expected) {
			console.error(
				"Wrong secret. Expected %s, received %s",
				expected,
				received
			);
			res.status(403).end();
			return;
		}

		pm2.pullAndReload("yagami", (err, meta) => {
			if (err) {
				res.status(400).send({ error: err.msg });
				console.log(`Failed to reload server: ${err.msg}`);
				return;
			}
			if (meta.rev) {
				res.status(500).send("Successfully updated");
				console.log("Successfully updated");
			}

			res.end();
		});
	});
	// Set up redirects
	for (let i = 0; i < redirects.length; i++) {
		let redirect = redirects[i];
		app.get(redirect.path, (req, res) => {
			res.redirect(redirect.dest);
		});
	}

	app.get("/api/:endpoint", async (req, res) => {
		let { endpoint } = req.params;
		await api.execute(endpoint, req, res);
	});

	app.use("/", express.static(path.join(__dirname, "public")));

	app.get("*", (req, res) => {
		// lgtm [js/missing-rate-limiting]
		res.status(404).sendFile(path.join(__dirname, "404.html"));
	});

	app.listen(PORT, () =>
		console.log(`Currently serving the page on http://localhost:${PORT}`)
	);
};
