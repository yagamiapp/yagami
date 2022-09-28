const { stripIndents } = require("common-tags/lib");
const {
	ButtonBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	PermissionFlagsBits,
	Colors,
	ButtonStyle,
} = require("discord.js");
const { fetchGuild, prisma } = require("../../lib/prisma");
const { execute } = require("./match_start_list");
const { MatchManager } = require("../../bancho/match-types/bracket/Match");

module.exports = {
	data: { customId: "start_match" },
	/**
	 *
	 * @param {import("discord.js").ButtonInteraction} interaction
	 * @param {*} command
	 */
	async execute(interaction, command) {
		let guild = await fetchGuild(interaction.guildId);
		let tournament = guild.active_tournament;

		if (
			command.options.recover &&
			!interaction.memberPermissions.has(
				PermissionFlagsBits.Administrator
			)
		) {
			let embed = new EmbedBuilder()
				.setDescription(
					"**Err:** You lack the permissions to perform this action"
				)
				.setColor(Colors.Red)
				.setFooter({
					text: "Please ping an admin to recover the match for you",
				});
			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		let round = await prisma.round.findFirst({
			where: {
				Match: {
					some: {
						id: parseInt(command.options.id),
					},
				},
				tournamentId: tournament.id,
			},
		});
		// Get the teams in the match
		let teams = await prisma.team.findMany({
			where: {
				InBracketMatches: {
					some: {
						matchId: parseInt(command.options.id),
					},
				},
			},
		});

		let match = await prisma.match.findFirst({
			where: {
				id: parseInt(command.options.id),
				Round: {
					tournamentId: tournament.id,
				},
			},
		});

		// Check that the team is not already in a running match
		let duplicateCheck = await prisma.match.findFirst({
			where: {
				Teams: {
					some: {
						OR: [
							{
								teamId: teams[0].id,
							},
							{
								teamId: teams[1].id,
							},
						],
					},
				},
				AND: [
					{
						state: {
							not: -1,
						},
					},
					{
						state: {
							lte: 7,
						},
					},
				],
			},
		});
		if (duplicateCheck) {
			console.log(duplicateCheck);
			let embed = new EmbedBuilder()
				.setDescription(
					"**Err**: One or more of the teams is in a match that is currently running"
				)
				.setColor(Colors.Red)
				.setFooter({
					text: "Make sure both teams are not in an active match",
				});

			let button = new ActionRowBuilder().addComponents([
				new ButtonBuilder()
					.setCustomId(
						`match_start_list?index=${command.options.index || 0}`
					)
					.setLabel("Back")
					.setStyle(ButtonStyle.Danger),
			]);
			if (command.options.recover) {
				await interaction.reply({
					embeds: [embed],
					ephemeral: true,
				});
				return;
			}
			await interaction.update({ embeds: [embed], components: [button] });
			return;
		}

		// Create match message
		let messageChannel = interaction.guild.channels.cache.find(
			(channel) => channel.id == guild.match_results_channel
		);
		messageChannel = messageChannel || interaction.channel;

		if (
			!messageChannel
				.permissionsFor(interaction.guild.members.me)
				.has(PermissionFlagsBits.SendMessages) ||
			!messageChannel.viewable
		) {
			let embed = new EmbedBuilder()
				.setDescription(
					`**Err**: Cannot post match results message in <#${messageChannel.id}>`
				)
				.setColor(Colors.Red)
				.setFooter({
					text: `Make sure the bot's match result channel is set up correctly`,
				});

			let button = new ActionRowBuilder().addComponents([
				new ButtonBuilder()
					.setCustomId(
						`match_start_list?index=${command.options.index}`
					)
					.setLabel("Back")
					.setStyle(ButtonStyle.Danger),
			]);

			if (command.options.recover) {
				await interaction.reply({
					embeds: [embed],
					ephemeral: true,
				});
				return;
			}
			await interaction.update({
				embeds: [embed],
				components: [button],
			});
			return;
		}
		await prisma.match.update({
			where: {
				id: match.id,
			},
			data: {
				state: 3,
			},
		});

		let players = await prisma.user.findMany({
			where: {
				InTeams: {
					some: {
						Team: {
							InBracketMatches: {
								some: {
									matchId: match.id,
								},
							},
						},
					},
				},
			},
			include: {
				DiscordAccounts: {
					select: {
						id: true,
					},
				},
			},
		});

		let matchEmbed = new EmbedBuilder()
			.setTitle(
				`${round.acronym}: (${teams[0].name}) vs (${teams[1].name})`
			)
			.setColor(tournament.color)
			.setThumbnail(tournament.icon_url)
			.setAuthor({ name: tournament.name, iconURL: tournament.icon_url })
			.setFooter({ text: "Current Phase: Waiting for MP Link" })
			.setDescription(
				`
            Your match is ready!
            
            Here's what you need to do to get started:
            `
			)
			.addFields(
				{
					name: "Create the match",
					value: stripIndents`
                Select one member of your match to make the lobby, by sending a DM to \`BanchoBot\` on osu:
                \`\`\`
                !mp make ${tournament.acronym}: (${teams[0].name}) vs (${teams[1].name})
                \`\`\`
            `,
				},
				{
					name: "Add yagami as a ref",
					value: stripIndents`
				Add the bot as a ref to your match:
				\`\`\`
				!mp addref ${process.env.BANCHO_USERNAME}
				\`\`\`
				`,
				},
				{
					name: "Point the bot to the match",
					value: stripIndents`
				Get the link to your match and paste it into the \`/match addlink\` command in this server
				\`\`\`
				/match addlink link:https://osu.ppy.sh/...
				\`\`\`
			`,
				}
			);
		let playerString = "";
		for (let player of players) {
			playerString += `<@${player.DiscordAccounts[0].id}> `; // I can't think of a way to ping the right user in less than 100 lines of code
		}

		let archiveTimer = setTimeout(async () => {
			// Creating a match with state 3 will start archive mode
			let archive = new MatchManager(match.id, null);
			await archive.createMatch();
		}, 15 * 60 * 1000);
		module.exports[`match-${match.id}`] = archiveTimer;

		if (command.options.recover) {
			await interaction.update({
				content: playerString,
				embeds: [matchEmbed],
				components: [],
			});
			return;
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
			options: { index: command.options.index },
		});
	},
};
