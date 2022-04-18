const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { getData, setData } = require("../../../firebase");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("edit")
		.setDescription("Edits your team")
		.addStringOption((option) =>
			option.setName("name").setDescription("The name of the team")
		)
		.addStringOption((option) =>
			option
				.setName("icon_url")
				.setDescription("Set a custom icon for your tournament")
		)
		.addStringOption((option) =>
			option
				.setName("color")
				.setDescription("Set a custom color for your tournament e.g.(#0EB8B9)")
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

		let options = interaction.options.data[0].options;

		// In case registration is disabled
		if (!currentTournament.allow_registration) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: You cannot edit your team while registration is closed."
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}
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
		if (!currentTournament.users[interaction.user.id]?.name) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You cannot edit your team unless you are the owner of the team`
				)
				.setColor("RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the icon_url does not lead to an image
		let urlRegex = /(?:http|https).+(?:jpg|jpeg|png|webp|gif|svg)/;
		if (
			interaction.options.getString("icon_url") &&
			!urlRegex.test(interaction.options.getString("icon_url"))
		) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: The icon url you provided is not a valid image."
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the color is not a valid hex color
		if (
			interaction.options.getString("color") &&
			!/#[1234567890abcdefABCDEF]{6}/.test(
				interaction.options.getString("color")
			)
		) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: The color you provided is not a valid hex color."
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let team = currentTournament.users[interaction.user.id];

		options.forEach((element) => {
			let prop = element.name;
			if (prop == "acronym") {
				acronym = element.value.toUpperCase();
			} else {
				team[prop] = element.value;
			}
		});

		currentTournament.users[interaction.user.id] = team;

		await setData(
			currentTournament,
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		let embed = new MessageEmbed()
			.setTitle("Settings updated")
			.setColor(team.color || "GREEN");
		if (team.icon_url) {
			embed.setThumbnail(team.icon_url);
		}
		let teamString = "";
		for (let i = 0; i < team.members.length; i++) {
			let member = team.members[i];
			let memberData = await getData("users", member);
			let rank = memberData.osu.statistics.global_rank;
			if (rank == null) {
				rank = "Unranked";
			} else {
				rank = `${rank.toLocaleString()}`;
			}

			teamString += `
			:flag_${memberData.osu.country_code.toLowerCase()}: ${
				memberData.osu.username
			} (#${rank})`;
			if (i == 0) {
				teamString += " **(c)**";
			}
		}
		embed.addField(team.name, teamString);

		await interaction.editReply({ embeds: [embed] });
	},
};
