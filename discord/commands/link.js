//@ts-check
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const crypto = require("crypto");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("link")
		.setDescription("Links your osu! account to your Discord Account"),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		var id = crypto.randomBytes(5).toString("hex");
		let user = interaction.user.toJSON();

		// Clear undefined keys from object
		Object.keys(user).forEach(
			(key) => user[key] === undefined && delete user[key]
		);

		// Key deletes itself after 60 seconds
		let interval = setTimeout(async () => {
			delete this[id];

			let embed = new MessageEmbed()
				.setDescription("Auth request timed out")
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
		}, 60000);

		// Assemble object to be stored
		let payload = { interaction, user, interval };
		this[id] = payload;

		let link = `https://osu.ppy.sh/oauth/authorize/?client_id=${process.env.osuClientId}&redirect_uri=${process.env.osuRedirectURI}&response_type=code&state=${id}`;

		let embed = new MessageEmbed()
			.setColor("#123456")
			.setDescription(`[Click here to login with osu!](${link})`);
		await interaction.editReply({ embeds: [embed] });
	},
	/**
	 *
	 * @param {string} id
	 */
	clearData(id) {
		delete this[id];
	},
};
