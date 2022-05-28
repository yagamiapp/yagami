let { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { stripIndents } = require("common-tags/lib");
const { fetchGuild, prisma } = require("../../prisma");

let modIcon = {
	NM: "<:NM:972256928757592144>",
	HD: "<:HD:972256986357964801>",
	HR: "<:HR:972256992380993616>",
	DT: "<:DT:972256999305781298>",
	FM: "<:FM:972257023297204325>",
	TB: "<:TB:972257028502339595>",
};

module.exports = {
	data: new MessageButton().setCustomId("round_list"),
	async execute(interaction, command) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		let rounds = await prisma.round.findMany({
			where: { tournamentId: tournament.id },
		});

		// In case there are no rounds
		if (rounds.length == 0) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: There are no rounds in this tournament."
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		let index = parseInt(command.options.index);

		// Select first round and build embed
		let round = rounds[index];
		let poolString = "";
		let pool = await prisma.mapInPool.findMany({
			where: {
				Mappool: {
					Round: {
						id: round.id,
					},
				},
			},
		});

		// TODO: Order pool by identifier in this order: NM, HD, HR, DT, EZ, FL, FM, TB
		// let alphabet = ["NM", "HD", "HR", "DT", "EZ", "FL", "FM", "TB"];
		if (command.options.admin || round.show_mappool) {
			for (const map of pool) {
				let data = await prisma.map.findFirst({
					where: {
						inPools: {
							some: {
								mappoolId: map.mappoolId,
							},
						},
						beatmap_id: map.mapId,
					},
				});

				let mapString = `${data.artist} - ${data.title} \\[${data.version}\\]`;
				let identifier = modIcon[map.identifier.substring(0, 2)];

				if (map.identifier.substring(2)) {
					identifier += ` **${map.identifier.substring(2)}**`;
				}
				poolString += `${identifier} [${mapString}](https://osu.ppy.sh/b/${data.beatmap_id})\n`;
			}
			if (poolString == "") poolString = "No maps";
		} else {
			poolString = "**Mappool is hidden**";
		}
		// Build buttons to scroll to other rounds
		let components = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(
					"round_list?index=" +
						(index - 1) +
						"&admin=" +
						command.options.admin
				)
				.setLabel("◀")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("placeholder")
				.setLabel(`${index + 1}/${rounds.length}`)
				.setStyle("SECONDARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId(
					"round_list?index=" +
						(index + 1) +
						"&admin=" +
						command.options.admin
				)
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
			.addField(
				"Statistics",
				stripIndents`
			    **Best of:** ${round.best_of}
			    **Bans:** ${round.bans}
			`
			)
			.setDescription("**Mappool** \n" + poolString)
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
