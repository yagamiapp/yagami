const { MessageButton, MessageEmbed } = require("discord.js");
const { getData, setData } = require("../../firebase");

module.exports = {
	data: new MessageButton().setCustomId("leave_team"),
	async execute(interaction, command) {
		let active_tournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);

		let currentTournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		let member = currentTournament.users[interaction.user.id].memberOf;
		let index = currentTournament.users[member].members.indexOf(
			interaction.user.id
		);
		if (index > -1) {
			currentTournament.users[member].members.splice(index, 1);
		}

		delete currentTournament.users[interaction.user.id];

		await setData(
			currentTournament,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		let embed = new MessageEmbed()
			.setTitle("Success")
			.setDescription(`You have left your team.`)
			.setColor("GREEN");
		await interaction.update({ embeds: [embed], components: [] });
	},
};
