let {
  ActionRowBuilder,
  ModalBuilder,
  TextInputStyle,
  TextInputBuilder,
  EmbedBuilder,
} = require('discord.js');
const { prisma } = require('../../lib/prisma');
module.exports = {
  data: new ModalBuilder()
    .setCustomId('scrims')
    .setTitle('Scrim creation screen')
    .setComponents([
      new ActionRowBuilder().addComponents([
        new TextInputBuilder()
          .setLabel('Team 1 players (one username on each line)')
          .setCustomId('team1')
          .setRequired(true)
          .setStyle(TextInputStyle.Paragraph),
      ]),
      new ActionRowBuilder().addComponents([
        new TextInputBuilder()
          .setLabel('Team 2 players (one username on each line)')
          .setCustomId('team2')
          .setRequired(true)
          .setStyle(TextInputStyle.Paragraph),
      ]),
      new ActionRowBuilder().addComponents([
        new TextInputBuilder()
          .setLabel('Mappool ID')
          .setCustomId('mappool')
          .setStyle(TextInputStyle.Short),
      ]),
      new ActionRowBuilder().addComponents([
        new TextInputBuilder()
          .setLabel('Best Of')
          .setCustomId('bestOf')
          .setStyle(TextInputStyle.Short),
      ]),
    ]),
  /**
   *
   * @param {import("discord.js").ModalSubmitInteraction} interaction
   * @param {object} command
   */
  async execute(interaction, command) {
    await interaction.deferReply({ ephemeral: true });

    let team1 = interaction.fields
      .getTextInputValue('team1')
      .split('\n')
      .filter((x) => x != '');
    let team2 = interaction.fields
      .getTextInputValue('team2')
      .split('\n')
      .filter((x) => x != '');
    let mappool = interaction.fields.getTextInputValue('mappool');
    let bestOf = interaction.fields.getTextInputValue('bestOf');

    console.log({ team1, team2, mappool, bestOf });

    let team1IDs = [];
    for (const player of team1) {
      let playerObj = await prisma.user.findFirst({
        where: {
          username: player,
        },
      });

      if (!playerObj) {
        let embed = new EmbedBuilder()
          .setDescription(
            '**Err:** ' + player + " is not registered with the bot, make sure they've signed up!"
          )
          .setFooter({ text: 'HINT: Check your capitalization!' });
        await interaction.editReply({ embed });
        return;
      }

      team1IDs.push(playerObj.id);
    }

    let team2IDs = [];
    for (const player of team2) {
      let playerObj = await prisma.user.findFirst({
        where: {
          username: player,
        },
      });

      if (!playerObj) {
        let embed = new EmbedBuilder()
          .setDescription(
            '**Err:** ' + player + " is not registered with the bot, make sure they've signed up!"
          )
          .setFooter({ text: 'HINT: Check your capitalization!' });
        await interaction.editReply({ embed });
        return;
      }

      team2IDs.push(playerObj.id);
    }

    let match = await prisma.match.create({
      data: {
        scrim: true,
      },
    });

    let matchSettings = await prisma.scrimSettings.create({
      data: {
        bans: 2,
        best_of: parseInt(bestOf),
        matchId: match.id,
      },
    });

    await prisma.team.create({
      data: {
        name: `scrim_${match.id}_1`,
        scrim: true,
      },
    });

    console.log({ team1IDs, team2IDs });

    await interaction.editReply({ content: team1 });
  },
};
