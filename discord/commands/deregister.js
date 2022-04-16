const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { setData, getData, pushData, updateUser } = require("../../firebase");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("deregister")
		.setDescription("Deregister from the tournament"),
	async execute(interaction) {
		let active_tournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			"active_tournament"
		);
		let currentTournament = await getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			active_tournament
		);

		// In case the user is not registered
		if (currentTournament?.users?.[interaction.user.id]?.name == null) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: You cannot deregister unless you are the owner of the team`
				)
				.setColor("RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}
		// In case the user's team has more than one member
		if (
			currentTournament.users[interaction.user.id].members.length > 1 &&
			!currentTournament.users[interaction.user.id].delete_warning
		) {
			await setData(
				true,
				"guilds",
				interaction.guildId,
				"tournaments",
				active_tournament,
				"users",
				interaction.user.id,
				"delete_warning"
			);

			setTimeout(async () => {
				await setData(
					null,
					"guilds",
					interaction.guildId,
					"tournaments",
					active_tournament,
					"users",
					interaction.user.id,
					"delete_warning"
				);
			}, 30 * 1000);

			let embed = new MessageEmbed()
				.setTitle("⚠ Warning ⚠")
				.setDescription(
					`If you deregister when you have more than one member in your team will result in the team being deleted, and will leave your members without a team.\n\nUse \`/deregister\` again to confirm you deregister.`
				)
				.setColor("DARK_RED");
			interaction.editReply({ embeds: [embed] });
			return;
		}
		currentTournament.users[interaction.user.id].members.forEach(
			async (member) => {
				await setData(
					{},
					"guilds",
					interaction.guildId,
					"tournaments",
					active_tournament,
					"users",
					member
				);
			}
		);

		let embed = new MessageEmbed()
			.setTitle("See you next time!")
			.setDescription(`Successfully deregistered to the tournament!`)
			.setColor("#F88000")
			.setThumbnail(
				currentTournament.settings.icon_url ||
					"https://yagami.clxxiii.dev/static/yagami%20var.png"
			);

		await interaction.editReply({ embeds: [embed] });
		return;
	},
	ephemeral: true,
	defer: true,
};
