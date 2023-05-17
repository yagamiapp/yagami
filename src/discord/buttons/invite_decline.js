const { EmbedBuilder, Colors } = require('discord.js');
const { prisma } = require('../../lib/prisma');

module.exports = {
  data: { customId: 'invite_decline' },
  async execute(interaction, command) {
    await prisma.teamInvite.deleteMany({
      where: {
        teamId: parseInt(command.options.team),
        Invitee: {
          DiscordAccounts: {
            some: {
              id: interaction.user.id,
            },
          },
        },
      },
    });
    let embed = new EmbedBuilder().setTitle('✅ Invite Declined').setColor(Colors.Red);
    interaction.update({ content: null, embeds: [embed], components: [] });
  },
};
