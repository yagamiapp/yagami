const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { getData, setData } = require("../../../firebase");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("edit")
		.setDescription("Edits your team")
		.addStringOption((option) =>
			option.setName("name").setDescription("The name of the team")
		),
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
		// In case the team size is 1
		if (currentTournament.settings.team_size == 1) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You cannot edit your team if the team size is 1.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		// In case the user does not own a team
		if (!currentTournament.users[interaction.user.id].name) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You cannot edit your team unless you are the owner of the team`
				)
				.setColor("RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}

		currentTournament.users[interaction.user.id].name =
			interaction.options.getString("name");

		await setData(
			currentTournament,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		let embed = new MessageEmbed()
			.setTitle("Success")
			.setDescription(
				`Your team has been renamed to \`${interaction.options.getString(
					"name"
				)}\``
			)
			.setColor("GREEN");
		await interaction.editReply({ embeds: [embed] });
	},
};
