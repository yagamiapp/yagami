let deploy = require("./deploy-commands");
const { GuildMember } = require("discord.js");
const { getData, setData } = require("../firebase");

module.exports = {
	async onGuildJoin(guild) {
		let guildData = await getData("guilds", guild.id);
		if (!guildData) {
			let data = {
				settings: {
					change_nickname: true,
				},
			};
			await setData(data, "guilds", guild.id);
		}
		deploy.deployCommands(guild.id);
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
