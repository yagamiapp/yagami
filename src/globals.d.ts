import type { Client, Collection, CommandInteraction, SlashCommandBuilder } from 'discord.js';

type Command = {
  data: SlashCommandBuilder;
  defer?: boolean;
  ephemeral?: boolean;
  execute: (interaction: CommandInteraction) => Promise<void>;
};

type Bot = Client & {
  commands?: Collection<string, Command>;
};

export { Command, Bot };
