const {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} = require("@discordjs/builders");
const fs = require("fs");
const { MessageEmbed } = require("discord.js");

// Subcommand Handler
let data = new SlashCommandBuilder()
	.setName("manage")
	.setDescription("Manage all settings related to your tournament");
let groups = {};
let subcommands = {};

const commandFiles = fs
	.readdirSync("./src/discord/commands/manage")
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const group = require(`./manage/${file}`);
	if (group.data instanceof SlashCommandSubcommandBuilder) {
		data.addSubcommand(group.data);
		subcommands[group.data.name] = group;
	} else {
		data.addSubcommandGroup(group.data);
		groups[group.data.name] = group;
	}
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
		let type = interaction.options.data[0].type;
		if (type == "SUB_COMMAND") {
			let group = interaction.options.getSubcommand();
			let file = subcommands[group];
			if (!file) return;
			await file.execute(interaction);
			return;
		}
		let group = interaction.options.getSubcommandGroup();
		let file = groups[group];
		if (!file) return;
		await file.execute(interaction);
	},
};
