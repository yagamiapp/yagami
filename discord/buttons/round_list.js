let { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { stripIndents } = require("common-tags/lib");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new MessageButton().setCustomId("round_list"),
	async execute(interaction, command) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		let rounds = await prisma.round.findMany({
			where: { tournamentId: tournament.id },
		});

		// In case there are no rounds
		if (rounds == []) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: There are no rounds in this tournament.")
				.setColor("RED");
			await interaction.reply({ embeds: [embed] });
			return;
		}

		let index = parseInt(command.options.index);

		// Select first round and build embed
		let round = rounds[index];
		let poolString = "";
		let pool = await prisma.map.findMany({ where: { roundId: round.id } });

		pool.forEach((element) => {
			poolString += `**[${element.identifier}]**: ${element.artist} - ${element.title} [${element.version}]\n`;
		});
		if (poolString == "") poolString = "No maps";
		// Build buttons to scroll to other rounds
		let components = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId("round_list?index=" + (index - 1))
				.setLabel("◀")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("placeholder")
				.setLabel(`${index + 1}/${rounds.length}`)
				.setStyle("SECONDARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId("round_list?index=" + (index + 1))
				.setLabel("▶")
				.setStyle("PRIMARY")
		);

		if (index == 0) {
			components.components[0].disabled = true;
		}

		if (index == rounds.length - 1) {
			components.components[2].disabled = true;
		}

		let embed = new MessageEmbed()
			.setColor(tournament.color)
			.setTitle(`${round.acronym}: ${round.name}`)
			.setDescription(
				stripIndents`
                **Best of:** ${round.best_of}
                **Bans:** ${round.bans}
            `
			)
			.addField("Mappool", poolString)
			.setThumbnail(tournament.icon_url);

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
