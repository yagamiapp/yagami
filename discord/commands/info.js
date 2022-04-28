//@ts-check
const { SlashCommandBuilder } = require("@discordjs/builders");
const { stripIndents } = require("common-tags/lib");
const { MessageEmbed } = require("discord.js");
const { "discord.js": djs } = require("../../package.json").dependencies;
const { start_time } = require("../../index");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("Shows info about the bot"),
	/**
	 *	Executes the command
	 * @param {import("discord.js").CommandInteraction} interaction
	 */
	async execute(interaction) {
		let embed = new MessageEmbed()
			.setColor("#F88000")
			.setTitle("Yagami")
			.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png")
			.setDescription(
				stripIndents`	

					> Response Time ➣ **${Date.now() - interaction.createdTimestamp}ms**
					> API Latency ➣ **${Math.round(interaction.client.ws.ping)} ms**
					> Host ➣ **DigitalOcean**
					> Boot-up ➣ **<t:${Math.round(start_time / 1000)}:R>**
					> Node Version ➣ **${process.versions.node}**
					> DJS Version ➣ **${djs}**
					> Servers ➣ **${interaction.client.guilds.cache.size}**
				`
			)
			.setTimestamp()
			.setFooter({
				text: "Developed by clxxiii#8958",
				iconURL: "https://clxxiii.dev/img/icon.png",
			});
		await interaction.reply({ embeds: [embed] });
	},
};
