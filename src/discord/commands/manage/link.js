const { SlashCommandSubcommandBuilder } = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const { prisma } = require('../../../lib/prisma');
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Colors,
} = require('discord.js');

// Subcommand Handler
let data = new SlashCommandSubcommandBuilder()
  .setName('link')
  .setDescription('Manage settings for linking accounts')
  .addChannelOption((option) =>
    option.setName('channel').setDescription('The channel to send the link message to')
  )
  .addRoleOption((option) => option.setName('role').setDescription('The role to add to users'));

module.exports = {
  data,
  /**
   *
   * @param {import("discord.js").CommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let channel = interaction.options.getChannel('channel');
    let role = interaction.options.getRole('role');

    let finishEmbed = new EmbedBuilder().setTitle('Settings changed').setColor('#F88000');

    if (channel) {
      let icon = interaction.guild.iconURL({
        dynamic: true,
        format: 'jpg',
        size: 128,
      });

      let button = new ButtonBuilder()
        .setLabel('Link Account')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('link');
      let embed = new EmbedBuilder()
        .setDescription(
          stripIndents`
            In order to use this bot, you must first link your account.

            Use \`/link\`, or click the button below, to link your account.
                `
        )
        .setColor('#F88000')
        .setAuthor({
          name: interaction.guild.name,
          iconURL: icon,
        });
      let row = new ActionRowBuilder().addComponents([button]);
      try {
        await channel.send({ embeds: [embed], components: [row] });
      } catch (e) {
        let embed = new EmbedBuilder()
          .setDescription('**Err:** Cannot send message in given channel')
          .setColor(Colors.Red);
        await interaction.editReply({ embeds: [embed] });
        return;
      }
      finishEmbed.addFields({
        name: 'Channel',
        value: `Link channel set to <#${channel.id}>`,
      });
    }

    if (role) {
      await prisma.guild.update({
        where: {
          guild_id: interaction.guildId,
        },
        data: {
          linked_role: role.id,
        },
      });

      finishEmbed.addFields({
        name: 'Role',
        value: `Link role set to <@&${role.id}>`,
      });
    }

    await interaction.editReply({ embeds: [finishEmbed] });
  },
};
