const { MessageButton, MessageEmbed, MessageActionRow } = require("discord.js");
const pm2 = require("pm2");

module.exports = {
	data: new MessageButton()
		.setCustomId("restart_bot")
		.setLabel("Decline")
		.setStyle("PRIMARY"),
	async execute(interaction, command) {
		if (interaction.user.id != "265144290240495617") return;

		await pm2.pullAndReload("yagami", (err, meta) => {
			if (err) {
				console.log(`Failed to reload server: ${err.msg}`);
				return;
			}
			if (meta.rev) {
				console.log("Successfully updated");
			}
		});

		await interaction.reply({ ephemeral: true, content: "Restarting..." });
	},
};
