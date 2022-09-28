const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder, Colors } = require("discord.js");
const { prisma } = require("../../lib/prisma");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("link")
		.setDescription("Links your osu! account to your Discord Account"),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		let member = interaction.member;
		// TODO: Use duplicate to show data if there is any
		let duplicate = await prisma.user.findFirst({
			where: {
				DiscordAccounts: {
					some: {
						id: member.user.id,
					},
				},
			},
		});

		// TODO: Add a link to profile setup
		let embed = new EmbedBuilder()
			.setTitle("⚠ This command is currently offline ⚠")
			.setDescription(
				`To connect your account, please go to the website, log in with osu!, go to settings, and add your discord account.
				Eventually, account setup will be made easier, but this is currently the only option.`
			)
			.setThumbnail("https://yagami.clxxiii.dev/icons/logo.png")
			.setColor(Colors.Red);
		await interaction.reply({ embeds: [embed] });
	},
};
