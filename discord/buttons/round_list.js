const { getData } = require("../../firebase");
let { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { stripIndents } = require("common-tags/lib");

module.exports = {
	data: new MessageButton().setCustomId("round_list"),
	async execute(interaction, command) {
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

		let index = parseInt(command.options.index);

		// Select first round and build embed
		let round = rounds[index];
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
				.setCustomId("round_list?index=" + (index - 1))
				.setLabel("⬅")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("placeholder")
				.setLabel(`${index + 1}/${rounds.length}`)
				.setStyle("SECONDARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId("round_list?index=" + (index + 1))
				.setLabel("➡")
				.setStyle("PRIMARY")
		);

		if (index == 0) {
			components.components[0].disabled = true;
		}

		if (index == rounds.length - 1) {
			components.components[2].disabled = true;
		}

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

		if (interaction.isCommand()) {
			await interaction.editReply({
				embeds: [embed],
				components: [components],
			});
			return;
		}
		await interaction.update({
			embeds: [embed],
			components: [components],
		});
	},
};
