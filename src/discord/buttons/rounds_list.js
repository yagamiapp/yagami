let {
	EmbedBuilder,
	MessageButton,
	MessageActionRow,
	MessageAttachment,
	Colors,
} = require("discord.js");
const { stripIndents } = require("common-tags/lib");
const { generateImage } = require("../poolToImg");
const { fetchGuild, prisma } = require("../../prisma");

module.exports = {
	data: { customId: "round_list" },
	async execute(interaction, command) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		let rounds = await prisma.round.findMany({
			where: { tournamentId: tournament.id },
		});

		// In case there are no rounds
		if (rounds.length == 0) {
			let embed = new EmbedBuilder()
				.setDescription(
					"**Err**: There are no rounds in this tournament."
				)
				.setColor(Colors.Red);
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
			orderBy: { modPriority: "asc" },
		});

		let attachment;
		let currentPrio;
		if (command.options.admin || round.show_mappool) {
			for (const map of pool) {
				let data = await prisma.map.findFirst({
					where: {
						InPools: {
							some: {
								mappoolId: map.mappoolId,
							},
						},
						beatmap_id: map.mapId,
					},
				});
				if (currentPrio != map.modPriority) {
					poolString += `\n`;
					currentPrio = map.modPriority;
				}
				poolString += `[${map.identifier}](https://osu.ppy.sh/b/${data.beatmap_id})  `;
			}
			if (poolString == "") poolString = "No maps";
			let image = await generateImage(round.mappoolId);
			attachment = new MessageAttachment(
				image.toBuffer("image/png"),
				"mappool.png"
			);
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

		let embed = new EmbedBuilder()
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
		let files = [];
		if (attachment) {
			embed.setImage("attachment://mappool.png");
			files = [attachment];
		}

		if (interaction.isCommand()) {
			await interaction.editReply({
				embeds: [embed],
				components: [components],
				files,
			});
			return;
		}
		await interaction.update({
			embeds: [embed],
			components: [components],
			files,
		});
	},
};
