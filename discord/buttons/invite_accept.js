const {
	MessageButton,
	ButtonInteraction,
	Message,
	MessageActionRow,
	MessageEmbed,
} = require("discord.js");
const { getData, setData } = require("../../firebase");

module.exports = {
	data: new MessageButton()
		.setCustomId("invite_accept")
		.setLabel("Accept")
		.setStyle("PRIMARY"),
	/**
	 *
	 * @param {ButtonInteraction} interaction
	 */
	async execute(interaction, command) {
		let active_tournament = await getData(
			"guilds",
			command.options.guild,
			"tournaments",
			"active_tournament"
		);
		let tournament = await getData(
			"guilds",
			command.options.guild,
			"tournaments",
			active_tournament
		);

		let userData = await getData("users", interaction.user.id);

		if (
			tournament.users[interaction.user.id] != null &&
			!command.options.team_override
		) {
			let inviteAccept = new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId(
						"invite_accept?user=" +
							interaction.user.id +
							"&guild=" +
							command.options.guild +
							"&team_override=true"
					)
					.setLabel("I'm sure")
					.setStyle("PRIMARY"),
				new MessageButton()
					.setCustomId(
						"invite_decline?user=" +
							interaction.user.id +
							"&guild=" +
							command.options.guild
					)
					.setLabel("Nevermind")
					.setStyle("DANGER")
			);
			let embed = new MessageEmbed()
				.setTitle("⚠ Warning ⚠")
				.setDescription(
					"You are already in a team. Joining this team will remove you from your current team."
				)
				.setColor("RED");
			await interaction.update({ embeds: [embed], components: [inviteAccept] });
			return;
		}

		tournament.users[interaction.user.id] = {
			memberOf: command.options.user,
		};

		tournament.users[command.options.user].members.push(interaction.user.id);

		let embed = new MessageEmbed()
			.setTitle("✅ Invite Accepted ✅")
			.setColor("GREEN");

		await setData(
			tournament,
			"guilds",
			command.options.guild,
			"tournaments",
			active_tournament
		);

		let tourneyGuild = await interaction.client.guilds.fetch(
			command.options.guild
		);
		let tourneyMember = await tourneyGuild.members.fetch(command.options.user);

		let dm = await tourneyMember.createDM();
		let dmEmbed = new MessageEmbed()
			.setTitle("🎉 Your invite was accepted! 🎉")
			.setDescription(
				` \`${userData.osu.username}\` accepted your invite to join your team!`
			)
			.setColor("#F88000");
		await dm.send({ embeds: [dmEmbed] });

		interaction.update({
			content: null,
			embeds: [embed],
			components: [],
		});
	},
};
