let template = require("../../../templates/tournament.json");
const firebase = require("../../../firebase");
let { stripIndent } = require("common-tags");
let { MessageEmbed } = require("discord.js");

module.exports = {
	async execute(interaction) {
		let acronym = interaction.options.getString("acronym");
		acronym = acronym.toUpperCase();
		console.log("Creating a new tournament with the acronym: " + acronym);

		console.log("Checking if tournament Already Exists:");
		let test = await firebase.getData(
			"guilds",
			interaction.guildId,
			"tournaments",
			acronym
		);
		if (test == null) {
			console.log("Test passed! Writing data to database");

			await firebase.setData(
				template,
				"guilds",
				interaction.guildId,
				"tournaments",
				acronym
			);

			await firebase.setData(
				acronym,
				"guilds",
				interaction.guildId,
				"tournaments",
				"active_tournament"
			);

			let message = stripIndent`
				Woohoo! 🥳 Your new tournament, \`${acronym}\` has been created!
				Currently, your tournament's name is \`My Tournament\`, but you can change that!

				Here are the next steps to get things running:
			`;
			let embed = new MessageEmbed()
				.setColor("#F88000")
				.setTitle("Tournament Creation Success")
				.setDescription(message)
				.setThumbnail(
					"https://yagami.clxxiii.dev/static/yagami%20var.png"
				)
				.addField(
					"Change the settings of the tournament:",
					stripIndent`
				\`\`\`
				/tournament edit
				\`\`\`
				`
				)
				.addField(
					"Begin making your first mappool",
					stripIndent`
				\`\`\`
				/rounds create
				\`\`\`
				`
				)
				.addField(
					"Add teams to your tournament",
					stripIndent`
				\`\`\`
				/teams create
				\`\`\`
				`
				)
				.addField(
					"Make your first match",
					stripIndent`
				\`\`\`
				/matches create
				\`\`\`
				`
				);
			await interaction.editReply({ embeds: [embed] });
		} else {
			console.log("Test Failed");

			let embed = new MessageEmbed()
				.setDescription(
					"**Error**: A tournament with the acronym `" +
						acronym +
						"` already exists in this guild!"
				)
				.setColor("#FF6666");
			await interaction.editReply({ embeds: [embed] });
		}
	},
};
