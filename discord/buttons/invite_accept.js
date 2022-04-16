const { MessageButton, MessageActionRow, MessageEmbed } = require("discord.js");
const { getData, setData } = require("../../firebase");

module.exports = {
	data: new MessageButton()
		.setCustomId("invite_accept")
		.setLabel("Accept")
		.setStyle("PRIMARY"),
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
			.setColor(tournament.settings.color)
			.setThumbnail(tournament.settings.icon_url);
		await dm.send({ embeds: [dmEmbed] });

		interaction.update({
			content: null,
			embeds: [embed],
			components: [],
		});
	},
};
