const firebase = require("../firebase");
const axios = require("axios");
const path = require("path");
const { MessageEmbed } = require("discord.js");
const linkCommand = require("../discord/commands/link");
const { request, response } = require("express");
const { stripIndents } = require("common-tags/lib");
require("dotenv").config();

/**
 *
 * @param {object} query
 * @param {request} req
 * @param {response} res
 */
module.exports.authUser = async (query, req, res) => {
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

	// Update embed with Success message
	let embed = new MessageEmbed()
		.setThumbnail(userData.avatar_url)
		.setTitle("Authorization Success!")

		.setImage(userData.cover_url)
		.setDescription(
			stripIndents`
			Successfully connected discord account to \`${userData.username}\`!
			
			**Rank**: \`#${userData.statistics.global_rank.toLocaleString()} (${
				userData.statistics.pp
			} pp)\`
			**Accuracy**: \`${userData.statistics.hit_accuracy}%\` | **Level**: \`${
				userData.statistics.level.current
			}\`
			**Total Score**: \`${userData.statistics.total_score}\`
			`
		)
		.setColor("LUMINOUS_VIVID_PINK");

	let interaction = linkCommand[query.state];
	interaction.editReply({ embeds: [embed] });
	linkCommand.clearInteraction(query.state);

	res.redirect("../authorized");
};
