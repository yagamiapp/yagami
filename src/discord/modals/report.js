const {
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	EmbedBuilder,
	Colors,
} = require("discord.js");

module.exports = {
	data: new ModalBuilder()
		.setCustomId("report")
		.setTitle("Report a bug")
		.setComponents([
			new ActionRowBuilder().addComponents([
				new TextInputBuilder()
					.setLabel("Brief description of the bug")
					.setCustomId("title")
					.setRequired(true)
					.setStyle(TextInputStyle.Short),
			]),
			new ActionRowBuilder().addComponents([
				new TextInputBuilder()
					.setLabel("Go into more detail")
					.setCustomId("content")
					.setRequired(true)
					.setStyle(TextInputStyle.Paragraph),
			]),
			new ActionRowBuilder().addComponents([
				new TextInputBuilder()
					.setLabel("Any helpful links/content")
					.setCustomId("links")
					.setStyle(TextInputStyle.Short),
			]),
		]),
	/**
	 *
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 * @param {object} command
	 */
	async execute(interaction, command) {
		await interaction.deferReply({ ephemeral: true });

		let title = interaction.components[0].components[0].value;
		let desc = interaction.components[1].components[0].value;
		let links = interaction.components[2].components[0].value;

		let avatar = interaction.user.avatarURL({
			dynamic: true,
			size: 256,
			format: "png",
		});

		let embed = new EmbedBuilder()
			.setAuthor({
				iconURL: avatar,
				name: interaction.user.tag,
			})
			.setTitle(title)
			.setColor(Colors.Red)
			.setDescription(desc)
			.setTimestamp()
			.addFields({ name: "Links", value: links || "No links provided" });

		let channel = interaction.client.channels.cache.get(
			process.env.BUG_CHANNEL_ID
		);
		try {
			await channel.send({ embeds: [embed] });
		} catch (e) {
			let embed = new EmbedBuilder()
				.setDescription(
					"**Err:** I can't send a message in the bug report channel, that's one mighty bug wouldn't you say?"
				)
				.setColor(Colors.Red)
				.setFooter({ text: "Go scream at the dev to fix it" });
			await interaction.editReply({ embeds: [embed] });
		}
		await interaction.editReply({ embeds: [embed] });
	},
};
