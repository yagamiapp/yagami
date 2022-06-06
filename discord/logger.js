const { stripIndents } = require("common-tags/lib");
const { MessageEmbed } = require("discord.js");

/**
 * @type {import("discord.js").TextChannel}
 */
let channel;

module.exports = {
	async setChannel(channelObj) {
		channel = channelObj;
	},

	/**
	 *
	 * @param {import("discord.js").Interaction} interaction
	 */
	async log(interaction) {
		let embed = new MessageEmbed();
		if (interaction.isCommand()) {
			// Craft message to send to console
			let options = interaction.options.data;
			let commandType = options[0]?.type;
			let commandString;

			if (commandType == "SUB_COMMAND_GROUP") {
				options = options[0];
				let commandGroup = options.name;
				options = options.options[0];
				let subcommand = options.name;
				options = options.options;

				commandString = `${interaction.commandName} ${commandGroup} ${subcommand}`;
			} else if (commandType == "SUB_COMMAND") {
				options = options[0];
				let subcommand = options.name;
				options = options.options;

				commandString = `${interaction.commandName} ${subcommand}`;
			} else {
				commandString = interaction.commandName;
			}

			let optionString = "";
			options.forEach((option) => {
				optionString += `${option.name}: ${option.value} `;
			});

			embed
				.setTitle("Command")
				.setDescription(`/${commandString} ${optionString}`)
				.setColor("BLUE");
		}

		if (interaction.isButton()) {
			// Restructure command id into command object
			let command = {};
			let stringParse = interaction.customId.split("?");
			command.name = stringParse[0];

			let options = {};
			stringParse[1]?.split("&").forEach((option) => {
				// Split into key value pairs
				option = option.split("=");
				options[option[0]] = option[1];
			});
			command.options = options;

			// Craft message to send to console
			let optionString = "";
			for (const key in command.options) {
				const element = command.options[key];
				optionString += `${key}: ${element}  `;
			}
			embed
				.setTitle("Button")
				.setDescription(`[${command.name}] ${optionString}`)
				.setColor("PURPLE");
		}

		if (interaction.isModalSubmit()) {
			// Restructure command id into command object
			let command = {};
			let stringParse = interaction.customId.split("?");
			command.name = stringParse[0];

			let options = {};
			stringParse[1]?.split("&").forEach((option) => {
				// Split into key value pairs
				option = option.split("=");
				options[option[0]] = option[1];
			});
			command.options = options;

			let optionString = "";
			for (const key in command.options) {
				const element = command.options[key];
				optionString += `${key}: ${element}  `;
			}
			embed
				.setTitle("Modal")
				.setDescription(`[${command.name}] ${optionString}`)
				.setColor("YELLOW");
		}

		embed
			.setTimestamp()
			.setAuthor({
				name: interaction.user.tag,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setFooter({
				iconURL: interaction.guild.iconURL(),
				text: interaction.guild?.name || "DM Channel",
			});

		try {
			await channel.send({ embeds: [embed] });
		} catch {
			console.log("CANNOT SEND MESSAGE IN LOG CHANNEL!!!");
		}
	},
	async error(msg, interaction) {
		let embed = new MessageEmbed();
		if (interaction) {
			embed
				.setTimestamp()
				.setAuthor({
					name: interaction.user.tag,
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setFooter({
					iconURL: interaction.guild.iconURL(),
					text: interaction.guild?.name || "DM Channel",
				});
		}
		let { stack } = msg;

		embed.setTitle("Error").setColor("RED");
		let errorMessage = stripIndents`
			\`\`\`
			${stack}
			\`\`\`
			`;

		try {
			await channel.send({ content: errorMessage, embeds: [embed] });
		} catch {
			console.log("CANNOT SEND MESSAGE IN LOG CHANNEL!!!");
		}
	},
};
