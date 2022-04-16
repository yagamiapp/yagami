const { stripIndents } = require("common-tags/lib");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const firebase = require("../../../firebase");
module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("delete")
		.setDescription("Deletes a tournament")
		.addStringOption((option) =>
			option
				.setName("acronym")
				.setDescription("The acronym of the tournament")
				.setRequired(true)
		),
	async execute(interaction) {
		let acro = interaction.options.getString("acronym").toUpperCase();
		let tourney = await firebase.getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			acro
		);

		if (tourney == null) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: No tournament with the acronym \`${acro}\` found.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		if (tourney?.delete_warning) {
			await firebase.setData(
				{},
				"guilds",
				interaction.guildId,
				"tournaments",
				acro
			);
			let tournaments = await firebase.getData(
				"guilds",
				interaction.guildId,
				"tournaments"
			);

			// Get last tournament in tourney list and
			let latestTourney;
			for (let key in tournaments) {
				let element = tournaments[key];
				if (!(element == acro) && !(key == "active_tournament")) {
					latestTourney = key;
				}
			}

			await firebase.setData(
				latestTourney,
				"guilds",
				interaction.guildId,
				"tournaments",
				"active_tournament"
			);

			let embed = new MessageEmbed()
				.setTitle("Successfully Deleted `" + acro + "`")
				.setColor("GREEN");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		await firebase.setData(
			true,
			"guilds",
			interaction.guildId,
			"tournaments",
			acro,
			"delete_warning"
		);

		setTimeout(() => {
			firebase.setData(
				{},
				"guilds",
				interaction.guildId,
				"tournaments",
				acro,
				"delete_warning"
			);
		}, 60000);

		let embed = new MessageEmbed()
			.setColor("DARK_RED")
			.setTitle("⚠ WARNING ⚠").setDescription(stripIndents`
                    Deleting a tournament is **IRREVERSIBLE** and **CANNOT** be undone.

                    All of your matches, teams, mappools, and settings will be **lost FOREVER!**
    
                    **If you wish to proceed in deleting this tournament, type the \`/tournament delete\` command again.**
                `);
		await interaction.editReply({ embeds: [embed] });
	},
};
