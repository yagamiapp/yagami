const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
	data: { customId: "invite_decline" },
	async execute(interaction, command) {
		let embed = new EmbedBuilder()
			.setTitle("✅ Invite Declined")
			.setColor(Colors.Red);
		interaction.update({ content: null, embeds: [embed], components: [] });
	},
};
