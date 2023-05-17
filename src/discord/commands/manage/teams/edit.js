const { SlashCommandSubcommandBuilder } = require('discord.js');
const { EmbedBuilder, Colors } = require('discord.js');
const { fetchGuild, prisma } = require('../../../../lib/prisma');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('edit')
    .setDescription('Edits the team')
    .addUserOption((option) =>
      option.setName('user').setDescription('A user from the team to edit').setRequired(true)
    )
    .addStringOption((option) => option.setName('name').setDescription('The name of the team'))
    .addStringOption((option) =>
      option.setName('icon_url').setDescription('Set a custom icon for your tournament')
    )
    .addStringOption((option) =>
      option.setName('color').setDescription('Set a custom color for your tournament e.g.(#0EB8B9)')
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let guild = await fetchGuild(interaction.guildId);
    let tournament = guild.active_tournament;

    let optionArr = interaction.options.data[0].options[0].options;
    let options = {};
    for (const option of optionArr) {
      if (option.name === 'user') continue;
      options[option.name] = option.value;
    }

    let team = await prisma.team.findFirst({
      where: {
        Members: {
          some: {
            User: {
              DiscordAccounts: {
                some: {
                  id: interaction.options.getUser('user').id,
                },
              },
            },
          },
        },
        tournamentId: tournament.id,
      },
    });

    // In case the user is not in a team
    if (!team) {
      let embed = new EmbedBuilder()
        .setDescription(`**Err**: That user is not in a team`)
        .setColor(Colors.Red);
      interaction.editReply({ embeds: [embed] });
      return;
    }
    // In case registration is disabled
    if (!tournament.allow_registrations) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: You cannot edit teams while registration is closed.')
        .setColor(Colors.Red);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    // In case the player name is longer than 25 characters
    if (options?.name?.length > 25) {
      let embed = new EmbedBuilder()
        .setDescription(`**Err**: The name of the team cannot be longer than 25 characters.`)
        .setColor(Colors.Red)
        .setFooter({
          text: 'If your team name is an emote, pick something else :)',
        });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // In case the icon_url does not lead to an image
    let urlRegex = /(?:http|https).+(?:jpg|jpeg|png|webp|gif|svg)/;
    if (
      interaction.options.getString('icon_url') &&
      !urlRegex.test(interaction.options.getString('icon_url'))
    ) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: The icon url you provided is not a valid image.')
        .setColor(Colors.Red);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    // In case the color is not a valid hex color
    if (
      interaction.options.getString('color') &&
      !/#[1234567890abcdefABCDEF]{6}/.test(interaction.options.getString('color'))
    ) {
      let embed = new EmbedBuilder()
        .setDescription('**Err**: The color you provided is not a valid hex color.')
        .setColor(Colors.Red);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    for (const key in options) {
      const value = options[key];
      team[key] = value;
    }

    await prisma.team.update({
      where: {
        id: team.id,
      },
      data: team,
    });

    let embed = new EmbedBuilder()
      .setTitle('Settings updated')
      .setColor(team.color || 'GREEN')
      .setThumbnail(team.icon_url);

    let members = await prisma.user.findMany({
      where: {
        InTeams: {
          some: {
            teamId: team.id,
          },
        },
      },
    });
    let teamString = '';
    for (let i = 0; i < members.length; i++) {
      let member = members[i];
      let rank = member.pp_rank;
      if (rank == null) {
        rank = 'Unranked';
      } else {
        rank = `${rank.toLocaleString()}`;
      }

      teamString += `
			:flag_${member.country_code.toLowerCase()}: ${member.username} (#${rank})`;
      if (i == 0) {
        teamString += ' **(c)**';
      }
    }
    embed.addFields({ name: team.name, value: teamString });

    await interaction.editReply({ embeds: [embed] });
  },
};
