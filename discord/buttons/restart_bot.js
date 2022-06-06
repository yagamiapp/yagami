const { MessageButton, MessageEmbed, MessageActionRow } = require("discord.js");
const pm2 = require("pm2");

module.exports = {
	data: new MessageButton()
		.setCustomId("restart_bot")
		.setLabel("Decline")
		.setStyle("PRIMARY"),
	async execute(interaction, command) {
		if (interaction.user.id != "265144290240495617") return;
		let button = new MessageButton()
			.setDisabled(true)
			.setCustomId("restart_bot")
			.setLabel("Restarting...")
			.setStyle("SECONDARY");
		await interaction.update({
			components: [new MessageActionRow().addComponents(button)],
		});
	},
};
