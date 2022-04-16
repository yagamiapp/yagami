const { MessageButton, MessageActionRow, MessageEmbed } = require("discord.js");
const { getData, setData } = require("../../firebase");

module.exports = {
	data: new MessageButton().setCustomId("dont_leave_team"),
	async execute(interaction, command) {
		let active_tournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);

		await setData(
			null,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament,
			"users",
			interaction.user.id,
			"confirm_leave"
		);

		interaction.update({ embeds: [], content: "👍", components: [] });
	},
};
