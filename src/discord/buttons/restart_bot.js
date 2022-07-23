const pm2 = require("pm2");

module.exports = {
	data: { customId: "restart_bot" },
	async execute(interaction, command) {
		if (interaction.user.id != "265144290240495617") return;

		pm2.restart("yagami", (err, meta) => {
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
