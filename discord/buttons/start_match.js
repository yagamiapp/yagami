const { stripIndents } = require("common-tags/lib");
const { MessageButton, MessageEmbed, MessageActionRow } = require("discord.js");
const { fetchGuild, prisma } = require("../../prisma");
const { execute } = require("./match_start_list");

module.exports = {
	data: new MessageButton()
		.setCustomId("start_match")
		.setLabel("Accept")
		.setStyle("PRIMARY"),
	/**
	 *
	 * @param {import("discord.js").ButtonInteraction} interaction
	 * @param {*} command
	 */
	async execute(interaction, command) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;
		// Get the teams in the match
		let teams = await prisma.team.findMany({
			where: {
				TeamInMatch: {
					some: {
						match_id: parseInt(command.options.id),
					},
				},
			},
		});

		let match = await prisma.match.findFirst({
			where: {
				id: parseInt(command.options.id),
			},
		});

		let round = await prisma.round.findFirst({
			where: {
				Match: {
					some: {
						id: match.id,
					},
				},
			},
		});

		// Check that the team is not already in a running match
		let duplicateCheck = await prisma.match.findFirst({
			where: {
				teams: {
					some: {
						OR: [
							{
								team_id: teams[0].id,
							},
							{
								team_id: teams[1].id,
							},
						],
					},
				},
				state: {
					lte: 7,
				},
			},
		});
		if (duplicateCheck) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: One of the teams is in a match that is currently running"
				)
				.setColor("RED")
				.setFooter({
					text: "Make sure the match is not already running",
				});

			let button = new MessageActionRow().addComponents([
				new MessageButton()
					.setCustomId(
						`match_start_list?round=${round.acronym}&index=${command.options.index}`
					)
					.setLabel("Back")
					.setStyle("DANGER"),
			]);

			await interaction.update({ embeds: [embed], components: [button] });
			return;
		}

		// Create match message
		let messageChannel = interaction.guild.channels.cache.find(
			(channel) => channel.id == guild.match_results_channel
		);

		await prisma.match.update({
			where: {
				id: match.id,
			},
			data: {
				state: 3,
			},
		});

		messageChannel = messageChannel || interaction.channel;
		let players = await prisma.user.findMany({
			where: {
				in_teams: {
					some: {
						team: {
							TeamInMatch: {
								some: {
									match_id: match.id,
								},
							},
						},
					},
				},
			},
		});

		let matchEmbed = new MessageEmbed()
			.setTitle(
				`${round.acronym}: (${teams[0].name}) vs (${teams[1].name})`
			)
			.setColor(tournament.color)
			.setThumbnail(tournament.icon_url)
			.setAuthor({ name: tournament.name, iconURL: tournament.icon_url })
			.setFooter({ text: "Current Phase: Waiting for MP Link" })
			.setDescription(
				`
            Your match will start in 15 minutes!
            
            Here's what you need to do to get started:
            `
			)
			.addField(
				"Create the match",
				stripIndents`
                Select one member of your match to make the lobby, by sending a DM to \`BanchoBot\` on osu:
                \`\`\`
                !mp make ${tournament.acronym}: (${teams[0].name}) vs (${teams[1].name})
                \`\`\`
            `
			)
			.addField(
				"Add yagami as a ref",
				stripIndents`
                Add the bot as a ref to your match:
                \`\`\`
                !mp addref ${process.env.banchoUsername}
                \`\`\`
            `
			)
			.addField(
				"Point the bot to the match",
				stripIndents`
                Get the link to your match and paste it into the \`/match addlink\` command in this server
                \`\`\`
                /match addlink link:https://osu.ppy.sh/...
				\`\`\`
            `
			);
		let playerString = "";
		for (let player of players) {
			playerString += `<@${player.discord_id}> `;
		}
		let message = await messageChannel.send({
			content: playerString,
			embeds: [matchEmbed],
		});

		await prisma.match.update({
			where: {
				id: match.id,
			},
			data: {
				message_id: message.id,
				channel_id: message.channelId,
			},
		});

		execute(interaction, {
			options: { round: round.acronym, index: command.options.index },
		});
	},
};
