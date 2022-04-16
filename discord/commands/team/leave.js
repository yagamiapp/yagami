const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { getData, setData } = require("../../../firebase");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("leave")
		.setDescription("Leave your current team"),
	async execute(interaction) {
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

		// In case registration is disabled
		if (!currentTournament.allow_registration) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: You cannot leave your team while registration is closed."
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the user is not in a team
		if (!currentTournament.users[interaction.user.id] == null) {
			let embed = new MessageEmbed()
				.setDescription(`**Err**: You are not in a team.`)
				.setColor("RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the user is the owner of the team
		if (currentTournament.users[interaction.user.id].name != null) {
			let embed = new MessageEmbed()
				.setDescription(`**Err**: You cannot leave your own team`)
				.setColor("RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}

		// Warn user before leaving
		await setData(
			true,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament,
			"users",
			interaction.user.id,
			"confirm_leave"
		);

		setTimeout(async () => {
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
		}, 10 * 1000);

		let confirm = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(`leave_team`)
				.setLabel("I'm sure")
				.setStyle("DANGER"),
			new MessageButton()
				.setCustomId("dont_leave_team")
				.setLabel("Nevermind")
				.setStyle("SECONDARY")
		);
		let embed = new MessageEmbed()
			.setTitle("Are you sure?")
			.setDescription(
				"If you leave your team, you will need an invite to join again."
			)
			.setColor("DARK_RED");
		interaction.editReply({ embeds: [embed], components: [confirm] });
		return;

		// let member = currentTournament.users[interaction.user.id].memberOf;
		// let index = currentTournament.users[member].members.indexOf(
		// 	interaction.user.id
		// );
		// if (index > -1) {
		// 	currentTournament.users[member].members.splice(index, 1);
		// }

		// delete currentTournament.users[interaction.user.id];

		// await setData(
		// 	currentTournament,
		// 	"guilds",
		// 	interaction.guildId,
		// 	"tournaments",
		// 	active_tournament
		// );

		// let embed = new MessageEmbed()
		// 	.setTitle("Success")
		// 	.setDescription(`You have left your team.`)
		// 	.setColor("GREEN");
		// interaction.editReply({ embeds: [embed] });
	},
};
