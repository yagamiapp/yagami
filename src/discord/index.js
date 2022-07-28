const {
	Client,
	GatewayIntentBits,
	Collection,
	EmbedBuilder,
	InteractionType,
	ApplicationCommandType,
	ApplicationCommandOptionType,
} = require("discord.js");
const fs = require("fs");
const join = require("./join");
const logger = require("./logger");

const bot = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});

module.exports = {
	async init() {
		await bot.login(process.env.discordToken);

		// Make Collection of commands
		bot.commands = new Collection();
		const commandFiles = fs
			.readdirSync("./src/discord/commands")
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
			.readdirSync("./src/discord/buttons")
			.filter((file) => file.endsWith(".js"));

		for (const file of buttonFiles) {
			const button = require(`./buttons/${file}`);
			bot.buttons.set(button.data.customId, button);
		}

		// Make collectio nof modals
		bot.modals = new Collection();
		const modalFiles = fs
			.readdirSync("./src/discord/modals")
			.filter((file) => file.endsWith(".js"));

		for (const file of modalFiles) {
			const modal = require(`./modals/${file}`);
			bot.modals.set(modal.data.data.custom_id, modal);
		}

		// Command Handler
		bot.on("interactionCreate", async (interaction) => {
			if (interaction.type != InteractionType.ApplicationCommand) return;
			await logger.log(interaction);

			// Craft message to send to console
			let options = interaction.options.data;
			let commandType = options[0]?.type;
			let commandString;

			if (commandType == ApplicationCommandOptionType.SubcommandGroup) {
				options = options[0];
				let commandGroup = options.name;
				options = options.options[0];
				let subcommand = options.name;
				options = options.options;

				commandString = `${interaction.commandName} ${commandGroup} ${subcommand}`;
			} else if (commandType == ApplicationCommandOptionType.Subcommand) {
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
				let embed = new EmbedBuilder()
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
			if (interaction.type != InteractionType.MessageComponent) return;
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
				let embed = new EmbedBuilder()
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
			if (interaction.type != InteractionType.ModalSubmit) return;
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
			console.log(bot.modals);
			if (!modal) return;

			try {
				await modal.execute(interaction, command);
			} catch (error) {
				console.log(error);
				let embed = new EmbedBuilder()
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

		let logChannel = await bot.channels.fetch(process.env.LOG_CHANNEL);
		await logger.setChannel(logChannel);
		await logger.init(bot);
	},
	bot,
};
