let { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { stripIndents } = require("common-tags/lib");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: new MessageButton().setCustomId("match_start_list"),
	async execute(interaction, command) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		let round = await prisma.round.findFirst({
			where: {
				tournamentId: tournament.id,
				acronym: command.options.round,
			},
		});
		let matches = await prisma.match.findMany({
			where: { roundId: round.id, OR: [{ state: 3 }, { state: 10 }] },
		});
		for (let i = 0; i < matches.length; i++) {
			matches[i].roundId = i + 1;
		}

		// Group elements into groups of 2
		let groups = [];
		let groupSize = 2;
		for (let i = 0; i < matches.length; i += groupSize) {
			groups.push(matches.slice(i, i + groupSize));
		}

		// In case there are no matches
		if (groups.length == 0) {
			let embed = new MessageEmbed()
				.setDescription("**Err**: There are no matches to start")
				.setColor("RED")
				.setFooter({
					text: "You can create a match with /matches create",
				});
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		// Select group and build embed
		let index = parseInt(command.options.index);
		let group = groups[index];
		if (!group) group = groups[0];

		// Build buttons to scroll to other rounds
		let pages = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(
					"match_start_list?index=" +
						(index - 1) +
						"&round=" +
						command.options.round
				)
				.setLabel("◀")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("placeholder")
				.setLabel(`${index + 1}/${groups.length}`)
				.setStyle("SECONDARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId(
					"match_start_list?index=" +
						(index + 1) +
						"&round=" +
						command.options.round
				)
				.setLabel("▶")
				.setStyle("PRIMARY")
		);

		if (index == 0) {
			pages.components[0].disabled = true;
		}

		if (index == groups.length - 1) {
			pages.components[2].disabled = true;
		}

		let embed = new MessageEmbed()
			.setColor(tournament.color)
			.setTitle(`${round.acronym}: Matches to start`)
			.setDescription(
				stripIndents`
			The following matches have not been started yet, 
			click the respectivebutton to start them.
            `
			)
			.setThumbnail(tournament.icon_url);

		let startButtons = new MessageActionRow();
		let viewButtons = new MessageActionRow();
		for (let match of group) {
			let teams = await prisma.team.findMany({
				where: {
					TeamInMatch: {
						some: {
							matchId: match.id,
						},
					},
				},
			});

			embed.addField(
				"Match " + match.id,
				`${teams[0].name} vs ${teams[1].name}`,
				true
			);
			let startButton = new MessageButton()
				.setLabel("Start match " + match.id)
				.setCustomId("start_match?id=" + match.id + "&index=" + index)
				.setStyle("SUCCESS");
			if (match.state != 10) {
				startButton
					.setLabel("Started match " + match.id)
					.setDisabled(true);
			}
			startButtons.addComponents([startButton]);
			viewButtons.addComponents([
				new MessageButton()
					.setLabel("View match " + match.id)
					.setCustomId(
						"view_match?id=" +
							match.id +
							"&index=" +
							index +
							"&round=" +
							command.options.round
					)
					.setStyle("SECONDARY"),
			]);
		}

		if (interaction.isCommand()) {
			await interaction.editReply({
				embeds: [embed],
				components: [viewButtons, startButtons, pages],
			});
			return;
		}
		await interaction.update({
			embeds: [embed],
			components: [viewButtons, startButtons, pages],
		});
	},
};
