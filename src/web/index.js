const express = require("express");
const { rateLimit } = require("express-rate-limit");
const app = express();
const { authUser } = require("./auth");
const { createHmac, timingSafeEqual } = require("crypto");
const { join } = require("path");
const redirects = require("./redirects.json");
const { execute } = require("./api");
const PORT = process.env.PORT | 3000;
const { pullAndReload } = require("pm2");

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

	app.get("/auth", (req, res) => { // lgtm [js/missing-rate-limiting]
		authUser(req.query, req, res);
	});

	app.post("/reload", (req, res) => {
		let ref = req.body.ref;
		if (!ref) return;

		// Check github secret hash
		var hmac = createHmac("sha256", process.env.GITHUB_SECRET);
		hmac.update(JSON.stringify(req.body), "utf-8");

		var xub = "X-Hub-Signature-256";
		var received = Buffer.from(
			req.headers[xub] || req.headers[xub.toLowerCase()],
			"utf8"
		);
		var expected = Buffer.from("sha256=" + hmac.digest("hex"), "utf8");

		if (!timingSafeEqual(received, expected)) {
			console.error(
				"Wrong secret. Expected %s, received %s",
				expected,
				received
			);
			res.status(403).end();
			return;
		}

		let branch = ref.match(/^refs\/heads\/(?<branch>\S+)/)?.groups?.branch;
		if (branch != process.env.GITHUB_PROD_BRANCH) {
			res.status(200)
				.send(
					JSON.stringify({
						message: `Commit not made to ${process.env.GITHUB_PROD_BRANCH} branch, ignoring request`,
					})
				)
				.end();
			return;
		}

		pullAndReload("yagami", (err, meta) => {
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
		await execute(endpoint, req, res);
	});

	app.use("/", express.static(join(__dirname, "public")));

	app.get("*", (req, res) => { // lgtm [js/missing-rate-limiting]
		res.status(404).sendFile(join(__dirname, "404.html"));
	});

	app.listen(PORT, () =>
		console.log(`Currently serving the page on http://localhost:${PORT}`)
	);
};
