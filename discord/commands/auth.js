//@ts-check
const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageEmbed } = require("discord.js");
const crypto = require("crypto");
const firebase = require("../../firebase");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("auth")
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

		let data = {
			guild: interaction.guildId,
			discord: user,
		};

		firebase.setData(data, "pending_users", id);

		let link = `https://osu.ppy.sh/oauth/authorize/?client_id=${process.env.osuClientId}&redirect_uri=${process.env.osuRedirectURI}&response_type=code&state=${id}`;

		let embed = new MessageEmbed()
			.setColor("#123456")
			.setDescription(`[Click here to login with osu!](${link})`);
		await interaction.editReply({ embeds: [embed] });
	},
	ephemeral: true,
};
