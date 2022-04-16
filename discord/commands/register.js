const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { setData, getData, updateUser } = require("../../firebase");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("register")
		.setDescription("Make a new team and register to the tournament"),
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

		if (!currentTournament.settings.allow_registration) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: Registrations are closed.")
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		if (currentTournament.users?.[interaction.user.id] != null) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You are already registered to the tournament!\n\nUse \`/deregister\` to deregister.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let user = await updateUser(interaction);

		// user.access_token = null;
		// user.last_profile_update = null;

		let team = {
			name: user.osu.username + "'s team",
			members: [interaction.user.id],
		};

		if (currentTournament.rules.team_size == 1) team.name = user.osu.username;

		await setData(
			team,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament,
			"users",
			interaction.user.id
		);

		if (currentTournament.rules.team_size == 1) {
			let embed = new MessageEmbed()
				.setTitle("Registered")
				.setDescription(`You have been registered to the tournament!`)
				.setColor("#F88000")
				.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png");

			await interaction.editReply({ embeds: [embed] });
			return;
		}

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
