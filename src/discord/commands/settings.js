const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder, Colors } = require('discord.js');
const { fetchGuild, prisma } = require('../../lib/prisma');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Edit global settings for the bot')
    .setDefaultMemberPermissions(0)
    .addBooleanOption((option) =>
      option
        .setName('change_nickname')
        .setDescription(
          'Change the nickname of users when they link their account, or when they join. Default: true'
        )
    )
    .addRoleOption((option) =>
      option.setName('linked_role').setDescription('The role given to users with a linked account')
    )
    .addRoleOption((option) =>
      option
        .setName('player_role')
        .setDescription('The role given to users when they are registered to the tournament')
    )
    .addChannelOption((option) =>
      option
        .setName('match_results_channel')
        .setDescription('The channel in which match messages will be posted')
    ),
  /**
   *
   * @param {import("discord.js").CommandInteraction} interaction
   */ async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let guild = await fetchGuild(interaction.guildId);
    let options = interaction.options.data;
    let description = '';

    let linkedRole = interaction.options.getRole('linked_role');
    if (!linkedRole.editable) {
      let embed = new EmbedBuilder()
        .setDescription(`**Err**: The bot cannot manage <@&${linkedRole.id}> role.`)
        .setColor(Colors.Red)
        .setFooter({
          text: 'Make sure the bot role is higher than the linked role in role settings',
        });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    let playerRole = interaction.options.getRole('linked_role');
    if (!linkedRole.editable) {
      let embed = new EmbedBuilder()
        .setDescription(`**Err**: The bot cannot manage <@&${playerRole.id}> role.`)
        .setColor(Colors.Red)
        .setFooter({
          text: 'Make sure the bot role is higher than the player role in role settings',
        });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    for (let option of options) {
      guild[option.name] = option.value;
      description += `**${option.name}**: ${option.value}\n`;
    }
    guild.active_tournament = guild.active_tournament.id;
    delete guild.tournaments;
    await prisma.guild.update({
      where: {
        guild_id: interaction.guildId,
      },
      data: guild,
    });

    if (description == '') {
      description = 'No settings updated';
    }

    let embed = new EmbedBuilder()
      .setTitle('Settings Updated')
      .setDescription(description)
      .setColor('#AAAAAA');
    await interaction.editReply({ embeds: [embed] });
  },
};
