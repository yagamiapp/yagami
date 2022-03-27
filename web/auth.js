const firebase = require("../firebase");
const axios = require("axios");
const path = require("path");
const { request, response } = require("express");
require("dotenv").config();

/**
 *
 * @param {object} query
 * @param {request} req
 * @param {response} res
 */
module.exports.authUser = async (query, req, res) => {
	console.log(query);

	let osuReqBody = {
		client_id: process.env.osuClientId,
		client_secret: process.env.osuClientSecret,
		code: query.code,
		grant_type: "authorization_code",
		redirect_uri: process.env.osuRedirectURI,
	};

	let authResponse = await axios({
		method: "post",
		url: "https://osu.ppy.sh/oauth/token",
		data: osuReqBody,
		validateStatus: () => true,
	});

	authResponse = authResponse.data;

	console.log(authResponse);

	if (authResponse.error) {
		res.writeHead(400);
		res.end();
		return;
	}

	let userData = await axios({
		method: "get",
		url: "https://osu.ppy.sh/api/v2/me/osu",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: "Bearer " + authResponse.access_token,
		},
	});
	userData = userData.data;

	let authReq = await firebase.getData("pending_users", query.state);

	let userPayload = {
		osu: userData,
		discord: authReq.discord,
	};

	await firebase.setData(
		userPayload,
		"guilds",
		authReq.guild,
		"users",
		authReq.discord.id
	);

	await firebase.setData({}, "pending_users", query.state);

	res.sendFile(path.join(__dirname, "auth.html"));
};
