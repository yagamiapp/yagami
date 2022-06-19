const {
	MessageButton,
	MessageActionRow,
	MessageEmbed,
	CommandInteraction,
} = require("discord.js");
const { prisma } = require("../../prisma");
let buttons = {
	left: new MessageButton(),
};

module.exports = {
	data: new MessageButton()
		.setCustomId("search")
		.setLabel("Search")
		.setStyle("PRIMARY"),
	/**
	 *
	 * @param {import("discord.js").Interaction} interaction
	 * @param {object} command
	 * @returns
	 */
	async execute(interaction, command) {
		let mappools = await prisma.mappool.findMany({});
		let embed = new MessageEmbed();

		// Group elements into groups of 3
		let groups = [];
		let groupSize = 3;
		for (let i = 0; i < mappools.length; i += groupSize) {
			groups.push(mappools.slice(i, i + groupSize));
		}
		let index = parseInt(command.options.index);

		let group = groups[index];

		// Build buttons to select a round
		let selector = new MessageActionRow();

		// Build buttons to scroll to other rounds
		let pager = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId("search?index=" + (index - 1))
				.setLabel("◀")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("placeholder")
				.setLabel(`${index + 1}/${groups.length}`)
				.setStyle("SECONDARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId("search?index=" + (index + 1))
				.setLabel("▶")
				.setStyle("PRIMARY")
		);

		// Build filter buttons

		// Send message
		if (interaction instanceof CommandInteraction) {
			await interaction.editReply({
				embeds: [embed],
				components: [pager],
			});
			return;
		}
		await interaction.update({
			content: null,
			embeds: [embed],
			components: [pager],
		});
	},
};
