const firebase = require("../firebase");
const axios = require("axios");
const { MessageEmbed } = require("discord.js");
const linkCommand = require("../discord/commands/link");
const { request, response } = require("express");
const { stripIndents } = require("common-tags/lib");
const { prisma } = require("../prisma");
require("dotenv").config();

/**
 *
 * @param {object} query
 * @param {request} req
 * @param {response} res
 */
module.exports.authUser = async (query, req, res) => {
	console.log("Authorizing...");
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
		console.log(authResponse);
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

	if (linkCommand[query.state] == null) {
		res.writeHead(400);
		res.end();
		return;
	}
	let { interaction, user, interval } = linkCommand[query.state];

	let userPayload = {
		discord_id: user.id,
		discord_avatar: user.avatar,
		discord_avatarURL: user.avatarURL,
		discord_bot: user.bot,
		discord_createdTimestamp: user.createdTimestamp,
		discord_defaultAvatarURL: user.defaultAvatarURL,
		discord_discriminator: user.discriminator,
		discord_displayAvatarURL: user.displayAvatarURL,
		discord_flags: user.flags,
		discord_system: user.system,
		discord_tag: user.tag,
		discord_username: user.username,
		osu_id: userData.id,
		osu_username: userData.username,
		osu_country_code: userData.country.code,
		osu_country_name: userData.country.name,
		osu_cover_url: userData.cover_url,
		osu_ranked_score: userData.statistics.ranked_score,
		osu_play_count: userData.statistics.play_count,
		osu_total_score: userData.statistics.total_score,
		osu_pp_rank: userData.statistics.global_rank ?? -1,
		osu_level: userData.statistics.level.current,
		osu_level_progress: userData.statistics.level.progress,
		osu_hit_accuracy: userData.statistics.hit_accuracy,
		osu_pp: userData.statistics.pp,
		token_access_token: authResponse.access_token,
		token_expires_in: authResponse.expires_in,
		token_refresh_token: authResponse.refresh_token,
		token_type: authResponse.token_type,
	};

	await prisma.user
		.create({
			data: userPayload,
		})
		.then(console.log)
		.catch(console.log);
	// Cancel timeout message
	clearInterval(interval);

	let rank = userData.statistics.global_rank;

	if (rank == null) {
		rank = "Unranked";
	} else {
		rank = rank.toLocaleString();
	}

	// Update embed with Success message
	let embed = new MessageEmbed()
		.setThumbnail(userData.avatar_url)
		.setTitle("Authorization Success!")

		.setImage(userData.cover_url)
		.setDescription(
			stripIndents`
			Successfully connected discord account to \`${userData.username}\`!
			
			**Rank**: \`#${rank} (${userData.statistics.pp} pp)\`
			**Accuracy**: \`${userData.statistics.hit_accuracy}%\` | **Level**: \`${
				userData.statistics.level.current
			}.${userData.statistics.level.progress}\`
			**Total Score**: \`${userData.statistics.total_score.toLocaleString()}\`
			`
		)
		.setColor("LUMINOUS_VIVID_PINK");

	// if (guild.settings.change_nickname && interaction.member.manageable) {
	// 	await interaction.member.setNickname(userData.username);
	// }
	// if (guild.settings.linked_role && interaction.member.manageable) {
	// 	let role = interaction.guild.roles.cache.find(
	// 		(r) => r.id === guild.settings.linked_role
	// 	);
	// 	if (role) {
	// 		await interaction.member.roles.add(role);
	// 	} else {
	// 		await firebase.setData(
	// 			null,
	// 			"guilds",
	// 			interaction.guildId,
	// 			"settings",
	// 			"linked_role"
	// 		);
	// 	}
	// }

	await interaction.editReply({ embeds: [embed] });

	linkCommand.clearData(query.state);

	res.redirect("../authorized/?id=" + user.id);
	res.end();
};
