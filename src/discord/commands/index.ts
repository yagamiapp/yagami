import {
  ApplicationCommandOptionType,
  Collection,
  EmbedBuilder,
  Interaction,
  InteractionType,
} from 'discord.js';
import { readdirSync } from 'fs';
import { Command } from '../../globals';

const commands = new Collection<string, Command>();

export const fetchCommandFiles = async () => {
  const commandFiles = readdirSync('./src/discord/commands')
    .filter((file) => file.endsWith('.ts'))
    .filter((file) => file != 'index.ts');

  for (const file of commandFiles) {
    const command: Command = await import(`./${file}`);
    commands.set(command.data.name, command);
  }
  return commands;
};

export const commandHandler = async (interaction: Interaction) => {
  if (interaction.type != InteractionType.ApplicationCommand) return;

  // Craft message to send to console
  let options = interaction.options.data;
  const commandType = options[0]?.type;
  let commandString: string;

  if (commandType == ApplicationCommandOptionType.SubcommandGroup) {
    const commandGroup = options[0].name;
    const subcommand = options[0].options[0].name;
    options = options[0].options[0].options;

    commandString = `${interaction.commandName} ${commandGroup} ${subcommand}`;
  } else if (commandType == ApplicationCommandOptionType.Subcommand) {
    const subcommand = options[0].name;
    options = options[0].options;

    commandString = `${interaction.commandName} ${subcommand}`;
  } else {
    commandString = interaction.commandName;
  }

  let optionString = '';
  options.forEach((option) => {
    optionString += `${option.name}: ${option.value} `;
  });

  const guild = interaction.guild.nameAcronym ?? 'DM Channel';
  console.log(`[${guild}] ${interaction.user.username} >> /${commandString} ${optionString}`);

  const command = commands.get(interaction.commandName);

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
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setDescription('**Err**: There was an error while executing this command!');

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }
};
