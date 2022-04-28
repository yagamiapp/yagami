//@ts-check
const { SlashCommandBuilder } = require("@discordjs/builders");
const { stripIndents } = require("common-tags/lib");
const { MessageEmbed } = require("discord.js");
const { version } = require("../../package.json");
const { prisma } = require("../../prisma");
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
		await interaction.deferReply();
		let uptime = Date.now() - start_time;
		let uptimeSplits = {
			days: Math.floor(uptime / (1000 * 60 * 60 * 24)),
			hours: Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
			mins: Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60)),
			secs: Math.floor((uptime % (1000 * 60)) / 1000),
		};
		let uptimeString =
			(uptimeSplits.days != 0 ? `${uptimeSplits.days} days ` : "") +
			(uptimeSplits.hours != 0 ? `${uptimeSplits.hours} hrs ` : "") +
			(uptimeSplits.mins != 0 ? `${uptimeSplits.mins} mins ` : "") +
			(uptimeSplits.secs != 0 ? `${uptimeSplits.secs} secs` : "");

		// TODO: Right align text
		let tournaments = await prisma.tournament.count({});
		let info = {
			Version: [
				{ name: "Bot Version", value: version },
				{ name: "Node Version", value: process.versions.node },
				{ name: "DJS Version", value: djs },
			],
			Latency: [
				{ name: "Uptime", value: uptimeString },
				{
					name: "Response Time",
					value: Date.now() - interaction.createdTimestamp + " ms",
				},
				{
					name: "API Latency",
					value: Math.round(interaction.client.ws.ping) + " ms",
				},
			],
			Statistics: [
				{ name: "Servers", value: interaction.client.guilds.cache.size },
				{ name: "Tournaments", value: tournaments },
			],
		};

		let maxLength = 48;
		for (const key in info) {
			const element = info[key];
		}

		let embed = new MessageEmbed()
			.setColor("#F88000")
			.setTitle("Yagami")
			.setDescription("A bot for managing tournaments")
			.setThumbnail("https://yagami.clxxiii.dev/static/yagami%20var.png")
			.addField(
				"Version",
				stripIndents`
				\`\`\`js
					➣ Bot Version    ${version}
					➣ Node Version   ${process.versions.node}
					➣ DJS Version    ${djs}
				\`\`\`
				`
			)
			.addField(
				"Latency",
				stripIndents`
				\`\`\`js
					➣ Uptime         ${uptimeString}
					➣ Response Time  ${Date.now() - interaction.createdTimestamp} ms
					➣ API Latency    ${Math.round(interaction.client.ws.ping)} ms
					\`\`\`
					`
			)
			.addField(
				"Statistics",
				stripIndents`
				\`\`\`js
					➣ Servers        ${interaction.client.guilds.cache.size}
					➣ Tournaments    ${tournaments}
				\`\`\`
				`
			);
		embed
			.addField(
				"Developer",
				stripIndents`
				<@265144290240495617>
				[Discord](no) | [Twitter](https://twitter.com/clxxiii1) | [GitHub](https://github.com/clxxiii) | [osu!](https://osu.ppy.sh/users/10962678)
				`
			)
			.setTimestamp()
			.setFooter({
				text: "Made with ❤️",
				iconURL: "https://clxxiii.dev/img/icon.png",
			});
		await interaction.editReply({ embeds: [embed] });
	},
};
