const {
	MessageButton,
	MessageActionRow,
	MessageEmbed,
	CommandInteraction,
} = require("discord.js");
const mappools = require("../../bancho/pools.json");
const { prisma } = require("../../prisma");
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
		let embed = new MessageEmbed()
			.setColor("#F88000")
			.setTitle("Mappool Search")
			.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png");

		let query = command.options.query || "";
		// Group elements into groups
		let groups = [];
		let groupSize = 5;
		for (let i = 0; i < mappools.length; i += groupSize) {
			groups.push(mappools.slice(i, i + groupSize));
		}
		let index = parseInt(command.options.i);

		let group = groups[index];

		// Build buttons to select a pool
		let selector = new MessageActionRow();
		for (let i = 0; i < group.length; i++) {
			let pool = group[i];
			embed.addField(pool.tournament, `${pool.iteration}: ${pool.round}`);
			selector.addComponents(
				new MessageButton()
					.setLabel(`View Pool ${i + 1}`)
					.setStyle("SUCCESS")
					.setCustomId(`view_pool?i=${i}`)
			);
		}

		// Build buttons to scroll to other pool
		let pager = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(`search?i=${index - 1}&q=${query}`)
				.setLabel("◀")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("placeholder")
				.setLabel(`${index + 1}/${groups.length}`)
				.setStyle("SECONDARY")
				.setDisabled(true),
			new MessageButton()
				.setCustomId(`search?i=${index + 1}&q=${query}`)
				.setLabel("▶")
				.setStyle("PRIMARY")
		);

		// Build filter buttons
		let filters = new MessageActionRow();
		if (command.options.query) {
		} else {
			filters.addComponents(
				new MessageButton()
					.setCustomId("search_modal?type=tournament")
					.setLabel("Filter by tournament")
					.setStyle("SECONDARY"),
				new MessageButton()
					.setCustomId("search_modal?type=iteration")
					.setLabel("Filter by iteration")
					.setStyle("SECONDARY"),
				new MessageButton()
					.setCustomId("search_modal?type=map_name")
					.setLabel("Filter by map name")
					.setStyle("SECONDARY"),
				new MessageButton()
					.setCustomId("search_modal?type=sr")
					.setLabel("Filter by star rating")
					.setStyle("SECONDARY")
			);
		}
		if (interaction instanceof CommandInteraction) {
			// Send message
			await interaction.editReply({
				embeds: [embed],
				components: [selector, filters, pager],
			});
			return;
		}
		await interaction.update({
			content: null,
			embeds: [embed],
			components: [selector, filters, pager],
		});
	},
};
