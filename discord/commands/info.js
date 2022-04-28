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
		let uptime = Date.now() - start_time;
		let uptimeSplits = {
			days: Math.floor(uptime / (1000 * 60 * 60 * 24)),
			hours: Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
			mins: Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60)),
			secs: Math.floor((uptime % (1000 * 60)) / 1000),
		};
		let uptimeString =
			(uptimeSplits.days != 0 ? `${uptimeSplits.days} days, ` : "") +
			(uptimeSplits.hours != 0 ? `${uptimeSplits.hours} hrs, ` : "") +
			(uptimeSplits.mins != 0 ? `${uptimeSplits.mins} mins, ` : "") +
			(uptimeSplits.secs != 0 ? `${uptimeSplits.secs} secs` : "");

		let embed = new MessageEmbed()
			.setColor("#F88000")
			.setTitle("Yagami")
			.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png")
			.setDescription(
				stripIndents`	

					> Response Time ➣ **${Date.now() - interaction.createdTimestamp}ms**
					> API Latency ➣ **${Math.round(interaction.client.ws.ping)} ms**
					> Host ➣ **DigitalOcean**
					> Uptime ➣ **${uptimeString}**
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
