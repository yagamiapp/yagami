const {
	CommandInteraction,
	MessageEmbed,
	MessageActionRow,
	MessageButton,
} = require("discord.js");
const { getData } = require("../../../firebase");

module.exports = {
	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		let user = interaction.options.getUser("user");
		let userData = await getData("users", user.id);
		// Just in case the user hasn't linked their account
		if (userData == null) {
			let embed = new MessageEmbed()
				.setDescription(
					`**Err**: User \`${user.tag}\` has not linked their account.`
				)
				.setColor("RED");
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		// Get data of inviter
		let inviterData = await getData("users", interaction.user.id);

		let dm = await user.createDM();
		let inviteAccept = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId("invite_accept")
				.setLabel("Accept")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("invite_decline")
				.setLabel("Decline")
				.setStyle("DANGER")
		);
		// Make an embed inviting the user to the team
		let embed = new MessageEmbed()
			.setTitle("Look who's popular! 🎉")
			.setDescription(
				"You've received an invite to join a team from " +
					inviterData.osu.username +
					"!"
			)
			.setColor("#F88000")
			.setThumbnail("https://s.ppy.sh/a/" + inviterData.osu.id)
			.setAuthor({
				iconURL: "https://s.ppy.sh/a/" + inviterData.osu.id,
				name: inviterData.osu.username,
				url: "https://osu.ppy.sh/u/" + inviterData.osu.id,
			});
		await interaction.editReply({
			embeds: [embed],
			components: [inviteAccept],
		});
	},
};
