const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder, Colors } = require("discord.js");
const { prisma } = require("../../prisma");
const crypto = require("crypto");
const { stripIndents } = require("common-tags/lib");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("link")
		.setDescription("Links your osu! account to your Discord Account"),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		let member = interaction.member;
		let duplicate = await prisma.user.findUnique({
			where: {
				discord_id: member.user.id,
			},
		});

		if (duplicate) {
			let roleId = (
				await prisma.guild.findUnique({
					where: {
						guild_id: interaction.guildId,
					},
				})
			).linked_role;
			let role = interaction.guild.roles.cache.get(roleId);
			if (role && role.editable && member.manageable) {
				await member.roles.add(role);
			}

			let embed = new EmbedBuilder()
				.setThumbnail(`https://s.ppy.sh/a/${duplicate.osu_id}`)
				.setTitle("Authorization Success!")
				.setDescription(
					stripIndents`
			Successfully connected discord account to \`${duplicate.osu_username}\`!
			
			**Rank**: \`#${duplicate.osu_pp_rank} (${duplicate.osu_pp} pp)\`
			**Accuracy**: \`${duplicate.osu_hit_accuracy}%\` | **Level**: \`${
						duplicate.osu_level
					}.${duplicate.osu_level_progress}\`
			**Total Score**: \`${duplicate.osu_total_score.toLocaleString()}\`
			`
				)
				.setColor("LUMINOUS_VIVID_PINK");
			if (duplicate.osu_cover_url) {
				embed.setImage(duplicate.osu_cover_url);
			}
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		var id = crypto.randomBytes(5).toString("hex");
		let userJson = interaction.user.toJSON();

		// Clear undefined keys from object
		Object.keys(userJson).forEach(
			(key) => userJson[key] === undefined && delete userJson[key]
		);

		// Key deletes itself after 60 seconds
		let interval = setTimeout(async () => {
			delete this[id];

			let embed = new EmbedBuilder()
				.setDescription("Auth request timed out")
				.setColor(Colors.Red);
			await interaction.editReply({ embeds: [embed] });
		}, 60000);

		// Assemble object to be stored
		let payload = { interaction, user: userJson, interval };
		module.exports[id] = payload;

		let link = `https://osu.ppy.sh/oauth/authorize/?client_id=${process.env.osuClientId}&redirect_uri=${process.env.osuRedirectURI}&response_type=code&state=${id}`;

		let embed = new EmbedBuilder()
			.setColor("#F88000")
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
