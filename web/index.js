const express = require("express");
const { rateLimit } = require("express-rate-limit");
const app = express();
const auth = require("./auth");
const path = require("path");
const redirects = require("./redirects.json");
const api = require("./api");
const PORT = process.env.PORT | 3000;

module.exports.init = () => {
	const limiter = rateLimit({
		windowMs: 30 * 1000,
		max: 15,
		standardHeaders: true,
		legacyHeaders: false,
	});

	// Apply the rate limiting middleware to all requests
	app.use(limiter);

	app.get("/auth", (req, res) => {
		auth.authUser(req.query, req, res);
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
		res.status(404).sendFile(path.join(__dirname, "404.html"));
	});

	app.listen(PORT, () =>
		console.log(`Currently serving the page on http://localhost:${PORT}`)
	);
};
