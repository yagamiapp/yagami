const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, GuildMember } = require("discord.js");
const { fetchGuild, prisma } = require("../../prisma");
const crypto = require("crypto");

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
				await member.edit({ roles: [role] });
			}

			await interaction.editReply("Link successful!");
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

			let embed = new MessageEmbed()
				.setDescription("Auth request timed out")
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
		}, 60000);

		// Assemble object to be stored
		let payload = { interaction, user: userJson, interval };
		module.exports[id] = payload;

		let link = `https://osu.ppy.sh/oauth/authorize/?client_id=${process.env.osuClientId}&redirect_uri=${process.env.osuRedirectURI}&response_type=code&state=${id}`;

		let embed = new MessageEmbed()
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
