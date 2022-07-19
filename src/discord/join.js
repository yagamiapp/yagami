let deploy = require("./deploy-commands");
const { EmbedBuilder } = require("discord.js");
const { prisma } = require("../prisma");
const { stripIndents } = require("common-tags/lib");

module.exports = {
	/**
	 *
	 * @param {import("discord.js").Guild} guild
	 */
	async onGuildJoin(guild) {
		deploy.deployCommands(guild);

		let guildObj = await prisma.guild.findMany({
			where: {
				guild_id: guild.id,
			},
		});
		if (!guildObj[0]) {
			prisma.guild
				.create({
					data: {
						guild_id: guild.id,
						change_nickname: true,
						linked_role: "",
						player_role: "",
					},
				})
				.catch((err) => console.log(err));
		}
		let embed = new EmbedBuilder()
			.setTitle("Thanks for the invite!")
			.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png")
			.setColor("#F88000")
			.setDescription(
				stripIndents`
				Welcome to Yagami, the future of osu! tournaments.
				Yagami is many things, a discord bot, an auto ref, and even a website!
				Over the course of the past 2 months, this bot has continuously been in development
				I'll add more to this when I have something more profound to say

				**Let's get your server up and running:**
				`
			)
			.addField("Set up your server settings:", `\`\`\`/settings\`\`\``)
			.addField(
				"Link your account to your osu! account:",
				`\`\`\`/link\`\`\``
			)
			.addField(
				"Set up your first tournament:",
				`\`\`\`/tournaments create\`\`\``
			)
			.setTimestamp()
			.setFooter({
				text: "Made with ❤️ by clxxiii#8958",
				iconURL: "https://clxxiii.dev/img/icon.png",
			});

		let permissionsEmbed = new EmbedBuilder()
			.setTitle("⚠️ Permissions Warning ⚠️")
			.setColor("DARK_ORANGE")
			.setImage("https://i.imgur.com/nLd71Ai.png")
			.setDescription(
				"A recent update to discord has changed the way slash command permissions work. Currently, I can't the permissions for you, and you wouldn't want players deleting your tournament, would you?"
			)
			.addField(
				"To change slash command settings:",
				"Go into your server settings, select integrations, and then click on Yagami to edit settings."
			)
			.addField(
				"The following commands should be restricted to admins only:",
				`
				> \`/settings\`
				> \`/tournaments\`
				> \`/rounds\`
				> \`/teams\`
				> \`/matches\`
			`
			);
		let channel = guild.channels.cache.find(
			(channel) =>
				channel.type === "GUILD_TEXT" &&
				channel.permissionsFor(guild.me).has("SEND_MESSAGES")
		);
		channel = guild.systemChannel || channel;
		await channel.send({ embeds: [embed, permissionsEmbed] });
	},
	/**
	 *
	 * @param {import("discord.js").GuildMember} member
	 */
	async onUserJoin(member) {
		if (member.user.bot) return;

		let guild = await getData("guilds", member.guild.id);
		if (!guild.settings.change_nickname) return;

		let userData = await getData("users", member.id);
		if (!userData) return;

		if (!member.manageable) return;

		await member.setNickname(userData.osu.username);

		let linkedRole = guild.settings.linked_role;
		if (!linkedRole) return;

		let linkedRoleObj = member.guild.roles.cache.get(linkedRole);
		if (!linkedRoleObj)
			await setData(
				null,
				"guilds",
				member.guild.id,
				"settings",
				"linked_role"
			);
		else await member.roles.add(linkedRoleObj);
	},
};
