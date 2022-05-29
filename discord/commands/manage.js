const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");
const { MessageEmbed } = require("discord.js");

// Subcommand Handler
let data = new SlashCommandBuilder()
	.setName("manage")
	.setDescription("Manage all settings related to your tournament");
let groups = {};

const subcommandGroupFiles = fs
	.readdirSync("./discord/commands/manage")
	.filter((file) => file.endsWith(".js"));

for (const file of subcommandGroupFiles) {
	const group = require(`./manage/${file}`);
	data.addSubcommandGroup(group.data);
	groups[group.data.name] = group;
}

module.exports = {
	data,
	/**
	 *
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		if (!interaction.memberPermissions.has("ADMINISTRATOR")) {
			let embed = new MessageEmbed()
				.setDescription(
					"**Err**: You need to be an admin to use this command!"
				)
				.setColor("RED")
				.setFooter({
					text: "If you'd like to disable admin checking, use /settings",
				});
			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}
		let group = interaction.options.getSubcommandGroup();
		let file = groups[group];
		await file.execute(interaction);
	},
};
