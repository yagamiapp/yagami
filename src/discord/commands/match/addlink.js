const { SlashCommandSubcommandBuilder } = require("discord.js");
const { prisma } = require("../../../lib/prisma");
const { EmbedBuilder, Colors } = require("discord.js");
const { MatchManager } = require("../../../bancho/match-types/bracket/Match");
const { stripIndents } = require("common-tags/lib");

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName("addlink")
		.setDescription("Add the link to your match")
		.addStringOption((option) =>
			option
				.setName("link")
				.setDescription("The link to the lobby")
				.setRequired(true)
		),
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		let matchId = await prisma.match.findFirst({
			where: {
				Teams: {
					some: {
						Team: {
							Members: {
								some: {
									User: {
										DiscordAccounts: {
											some: {
												id: interaction.user.id,
											},
										},
									},
								},
							},
						},
					},
				},
				state: 3,
			},
		});
		matchId = matchId?.id;

		if (!matchId) {
			let embed = new EmbedBuilder()
				.setDescription(
					"**Err**: You are not in a match that requires an MP link."
				)
				.setColor(Colors.Red);
			return interaction.editReply({ embeds: [embed] });
		}

		let embed = new EmbedBuilder();
		embed
			.setTitle("Loading match")
			.setDescription(
				"<a:loading:970406520124764200> We're currently setting up your match..."
			)
			.setColor("#F88000");
		await interaction.editReply({ embeds: [embed] });

		let match = new MatchManager(
			matchId,
			interaction.options.getString("link")
		);
		try {
			await match.createMatch();
		} catch (e) {
			console.log(e);
			embed = new EmbedBuilder()
				.setDescription(
					"**Err**: We encountered an error while joining the match"
				)
				.setColor(Colors.Red)
				.setFooter({
					text: "Make sure the lobby exists, and that you added the bot as a ref",
				});
			await interaction.editReply({ embeds: [embed] });
		}

		let archiveTimeout = require("../../buttons/start_match")[
			`match-${match.id}`
		];
		clearTimeout(archiveTimeout);
		embed
			.setTitle("Match loaded!")
			.setColor(Colors.Green)
			.setDescription(
				"<a:verified:970410957710954636> Check your invite message for more info"
			);
		interaction.editReply({ embeds: [embed] });
		let channel = await interaction.guild.channels.fetch(match.channel_id);
		let message = await channel.messages.fetch(match.message_id);
		let oldembed = message.embeds[0];

		embed = new EmbedBuilder()
			.setTitle(oldembed.title)
			.setColor(Colors.Green)
			.setAuthor(oldembed.author)
			.setThumbnail(oldembed.thumbnail?.url)
			.setURL(match.mp)
			.setDescription(
				stripIndents`
				Match link accepted!

				This match will be running the this lobby: 
				${match.mp}

				Sending invites to the players now...
			`
			)
			.setFooter({ text: "The match will start when the lobby is full" });
		message.edit({ content: null, embeds: [embed] });
	},
};
