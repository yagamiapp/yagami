const { Client, Intents, Collection, MessageEmbed } = require("discord.js");
const fs = require("fs");
const join = require("./join");
const logger = require("./logger");

const bot = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
});

module.exports = {
	async init() {
		await bot.login(process.env.discordToken);

		// Make Collection of commands
		bot.commands = new Collection();
		const commandFiles = fs
			.readdirSync("./discord/commands")
			.filter((file) => file.endsWith(".js"));

		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);
			// Set a new item in the Collection
			// With the key as the command name and the value as the exported module
			bot.commands.set(command.data.name, command);
		}

		// Make collection of buttons
		bot.buttons = new Collection();
		const buttonFiles = fs
			.readdirSync("./discord/buttons")
			.filter((file) => file.endsWith(".js"));

		for (const file of buttonFiles) {
			const button = require(`./buttons/${file}`);
			bot.buttons.set(button.data.customId, button);
		}

		// Make collectio nof modals
		bot.modals = new Collection();
		const modalFiles = fs
			.readdirSync("./discord/modals")
			.filter((file) => file.endsWith(".js"));

		for (const file of modalFiles) {
			const modal = require(`./modals/${file}`);
			bot.modals.set(modal.data.customId, modal);
		}

		// Command Handler
		bot.on("interactionCreate", async (interaction) => {
			if (!interaction.isCommand()) return;
			await logger.log(interaction);

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

			let guild = interaction.guild.nameAcronym ?? "DM Channel";
			console.log(
				`[${guild}] ${interaction.user.username}#${interaction.user.discriminator} >> /${commandString} ${optionString}`
			);

			const command = bot.commands.get(interaction.commandName);

			if (!command) return;

			try {
				if (command.defer) {
					await interaction.deferReply({
						ephemeral: command.ephemeral,
					});
				}
				await command.execute(interaction);
			} catch (error) {
				console.log(error);
				let embed = new MessageEmbed()
					.setColor("#ff0000")
					.setDescription(
						"**Err**: There was an error while executing this command!"
					);
				await logger.error(error, interaction);
				if (interaction.replied || interaction.deferred) {
					await interaction.editReply({
						embeds: [embed],
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						embeds: [embed],
						ephemeral: true,
					});
				}
			}
		});
		// Button Handler
		bot.on("interactionCreate", async (interaction) => {
			if (!interaction.isButton()) return;
			await logger.log(interaction);

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
			let guild = interaction.guild?.nameAcronym ?? "DM Channel";
			let optionString = "";
			for (const key in command.options) {
				const element = command.options[key];
				optionString += `${key}: ${element}  `;
			}
			console.log(
				`[${guild}] ${interaction.user.username}#${interaction.user.discriminator} >> [${command.name}] ${optionString}`
			);

			const button = bot.buttons.get(command.name);
			if (!button) return;

			try {
				await button.execute(interaction, command);
			} catch (error) {
				console.log(error);
				let embed = new MessageEmbed()
					.setColor("#ff0000")
					.setDescription(
						"**Err**: There was an error while executing this button!"
					);
				await logger.error(error, interaction);
				if (interaction.replied || interaction.deferred) {
					await interaction.editReply({
						embeds: [embed],
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						embeds: [embed],
						ephemeral: true,
					});
				}
			}
		});

		// Modal Handler
		bot.on("interactionCreate", async (interaction) => {
			if (!interaction.isModalSubmit()) return;
			await logger.log(interaction);

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
			let guild = interaction.guild?.nameAcronym ?? "DM Channel";
			let optionString = "";
			for (const key in command.options) {
				const element = command.options[key];
				optionString += `${key}: ${element}  `;
			}
			console.log(
				`[${guild}] ${interaction.user.username}#${interaction.user.discriminator} >> <${command.name}> ${optionString}`
			);

			const modal = bot.modals.get(command.name);
			if (!modal) return;

			try {
				await modal.execute(interaction, command);
			} catch (error) {
				console.log(error);
				let embed = new MessageEmbed()
					.setColor("#ff0000")
					.setDescription(
						"**Err**: There was an error while executing this modal!"
					);
				await logger.error(error, interaction);
				if (interaction.replied || interaction.deferred) {
					await interaction.editReply({
						embeds: [embed],
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						embeds: [embed],
						ephemeral: true,
					});
				}
			}
		});

		// Setup server on join
		bot.on("guildCreate", (ev) => {
			join.onGuildJoin(ev);
		});

		// Check user on join
		bot.on("guildMemberAdd", (member) => {
			if (member.user.bot) return;
			join.onUserJoin(member);
		});

		bot.once("ready", () => {
			console.log("Connected to Discord!");

			// Log current servers
			let guildString = "";
			bot.guilds.cache.forEach((guild) => {
				guildString += `${guild.name}, `;
			});
			guildString = guildString.slice(0, -2);
			console.log(`Current Guilds: ${guildString}`);
		});

		let logChannel = await bot.channels.fetch("767464530405228574");
		await logger.setChannel(logChannel);
	},
	bot,
};
