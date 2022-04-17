const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { getData } = require("../../../firebase");
let { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { stripIndents } = require("common-tags/lib");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("List the rounds"),
	async execute(interaction) {
		let active_tournament = await getData(
			"guilds",
			interaction.guild.id,
			"tournaments",
			"active_tournament"
		);

		let tournament = await getData(
			"guilds",
			interaction.guild.id,
			"tournaments",
			active_tournament
		);

		// In case there are no rounds
		if (tournament.rounds.length == 0) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: There are no rounds in this tournament."
				)
				.setColor("RED");
			await interaction.reply({ embeds: [embed] });
			return;
		}

		// Put rounds in array
		let rounds = [];
		for (const key in tournament.rounds) {
			const element = tournament.rounds[key];
			element.identifier = key;
			rounds.push(element);
		}

		// Select first round and build embed
		let round = rounds[0];
		let poolString = "";
		if (round.pool != null) {
			round.pool.forEach((element) => {
				poolString += `**[${element.identifier}]**: ${element.data.artist} - ${element.data.title} [${element.data.version}]\n`;
			});
		} else {
			poolString = "No pool";
		}

		// Build buttons to scroll to other rounds
		let components = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId("round_list")
				.setLabel("⬅")
				.setStyle("PRIMARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId("placeholder")
				.setLabel(`1/${rounds.length}`)
				.setStyle("SECONDARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId("round_list?index=1")
				.setLabel("➡")
				.setStyle("PRIMARY")
		);

		if (rounds.length == 1) {
			components.components[2].disabled = true;
		}

		console.log(components);

		let embed = new MessageEmbed()
			.setColor(tournament.settings.color)
			.setTitle(round.name)
			.setDescription(
				stripIndents`
                **Best of:** ${round.best_of}
                **Bans:** ${round.bans}
            `
			)
			.addField("Mappool", poolString)
			.setThumbnail(tournament.settings.icon_url);
		await interaction.editReply({
			embeds: [embed],
			components: [components],
		});
	},
};
