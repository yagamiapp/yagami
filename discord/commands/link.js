//@ts-check
const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageEmbed } = require("discord.js");
const crypto = require("crypto");
const firebase = require("../../firebase");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("link")
		.setDescription("Links your osu! account to your Discord Account"),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		var id = crypto.randomBytes(5).toString("hex");
		let user = interaction.user.toJSON();

		// Clear undefined keys from object
		Object.keys(user).forEach(
			(key) => user[key] === undefined && delete user[key]
		);

		// Key deletes itself after 60 seconds
		setTimeout(() => {
			firebase.setData({}, "pending_users", id);
		}, 60000);

		let data = {
			guild: interaction.guildId,
			discord: user,
			interaction: {
				channel: interaction.channelId,
				message: interaction.id,
			},
		};

		firebase.setData(data, "pending_users", id);

		let link = `https://osu.ppy.sh/oauth/authorize/?client_id=${process.env.osuClientId}&redirect_uri=${process.env.osuRedirectURI}&response_type=code&state=${id}`;

		let embed = new MessageEmbed()
			.setColor("#123456")
			.setDescription(`[Click here to login with osu!](${link})`);
		await interaction.editReply({ embeds: [embed] });
	},
	ephemeral: true,
	defer: true,
};
