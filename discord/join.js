let deploy = require("./deploy-commands");
const { GuildMember } = require("discord.js");
const { prisma } = require("../prisma");

module.exports = {
	async onGuildJoin(guild) {
		deploy.deployCommands(guild);
		let tournament = await prisma.guild.findMany({
			where: {
				guild_id: guild.id,
			},
		});
		if (!tournament[0]) {
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
	},
	/**
	 *
	 * @param {GuildMember} member
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
			await setData(null, "guilds", member.guild.id, "settings", "linked_role");
		else await member.roles.add(linkedRoleObj);
	},
};
