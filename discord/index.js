const { Client, Intents, Collection, MessageEmbed } = require("discord.js");
const commandUpdate = require("./deploy-commands");
const fs = require("fs");
const join = require("./join");
require("dotenv").config();

const bot = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.GUILD_MEMBERS,
	],
});

module.exports = {
	async init() {
		bot.login(process.env.discordToken);
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

		// Command updating for testing purposes
		let guild = await bot.guilds.fetch(process.env.testGuildId);
		commandUpdate.deployCommands(guild);

		// Command Handler
		bot.on("interactionCreate", async (interaction) => {
			if (!interaction.isCommand()) return;

			// Craft message to send to console

			console.log(interaction.options.data[0]);
			let optionString = "";
			if (interaction.options.data[0].options) {
				interaction.options.data[0].options.forEach((option) => {
					optionString += `${option.name}: ${option.value}  `;
				});
			} else if (interaction.options.data) {
				interaction.options.data.forEach((option) => {
					optionString += `${option.name}: ${option.value}  `;
				});
			}
			let subcommand;
			try {
				subcommand = interaction.options.getSubcommand();
			} catch {
				subcommand = "";
			}
			let guild = interaction.guild.nameAcronym ?? "DM Channel";
			console.log(
				`[${guild}] ${interaction.user.username}#${interaction.user.discriminator} >> /${interaction.commandName} ${subcommand} ${optionString}`
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
				console.error(error);
				let embed = new MessageEmbed()
					.setColor("#ff0000")
					.setDescription(
						"**Err**: There was an error while executing this command!"
					);
				await interaction.editReply({
					embeds: [embed],
					ephemeral: true,
				});
			}
		});
		// Button Handler
		bot.on("interactionCreate", async (interaction) => {
			if (!interaction.isButton()) return;

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
				console.error(error);
				let embed = new MessageEmbed()
					.setColor("#ff0000")
					.setDescription(
						"**Err**: There was an error while executing this button!"
					);
				await interaction.reply({
					embeds: [embed],
					ephemeral: true,
				});
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
	},
	getBot() {
		return bot;
	},
};
