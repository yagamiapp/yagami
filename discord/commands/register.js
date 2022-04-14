const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { setData, getData, pushData, updateUser } = require("../../firebase");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("register")
		.setDescription("Make a new team and register to the tournament"),
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
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

		if (currentTournament.teams?.[interaction.user.id] != null) {
			let embed = new MessageEmbed()
				.setTitle("Error")
				.setDescription(
					`You are already registered to the tournament!\n\nUse \`/deregister\` to deregister.`
				)
				.setColor("RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}

		let user = await updateUser(interaction);

		user.access_token = null;
		user.last_profile_update = null;

		if (currentTournament.rules.team_size == 1) {
			await setData(
				user,
				"guilds",
				interaction.guildId,
				"tournaments",
				active_tournament,
				"teams",
				interaction.user.id
			);

			let embed = new MessageEmbed()
				.setTitle("Registered")
				.setDescription(`You have been registered to the tournament!`)
				.setColor("#F88000")
				.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png");

			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let team = {
			name: "My Team",
			members: [user],
		};

		await setData(
			team,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament,
			"teams",
			interaction.user.id
		);

		let embed = new MessageEmbed()
			.setTitle("Registered")
			.setDescription(
				`You have been registered to the tournament!\n\nYou can change your team name and invite players with /team`
			)
			.setColor("#F88000")
			.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png");

		await interaction.editReply({ embeds: [embed] });
	},
	ephemeral: true,
	defer: true,
};
