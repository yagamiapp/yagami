import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { deployCommands } from '../../lib/deploy';

export const data = new SlashCommandBuilder()
  .setName('updatecommands')
  .setDescription('Updates guild permissions and commands')
  .setDefaultMemberPermissions(0);
export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();
  await deployCommands(interaction.guild);

  const embed = new EmbedBuilder()
    .setColor('#BBBBBB')
    .setDescription('Updated guild commands and permissions');
  await interaction.editReply({ embeds: [embed] });
}
