const express = require("express");
const app = express();
const auth = require("./auth");
const path = require("path");
const PORT = process.env.PORT | 3000;

module.exports.init = () => {
	app.get("/auth", (req, res) => {
		auth.authUser(req.query, req, res);
	});

	app.get("/invite", (req, res) => {
		res.redirect(
			"https://discord.com/api/oauth2/authorize?client_id=956030276050493441&permissions=36843030592&scope=bot%20applications.commands"
		);
	});

	// app.get("/api/:endpoint", (req, res) => {

	// });

	app.use("/", express.static(path.join(__dirname, "public")));

	app.get("*", (req, res) => {
		res.status(404).sendFile(path.join(__dirname, "404.html"));
	});

	app.listen(PORT, () =>
		console.log(`Currently serving the page on http://localhost:${PORT}`)
	);
};