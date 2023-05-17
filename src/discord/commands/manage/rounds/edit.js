const { SlashCommandSubcommandBuilder } = require('discord.js');
let { EmbedBuilder, Colors } = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const { fetchGuild, prisma } = require('../../../../lib/prisma');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName('edit')
    .setDescription('Create a new round')
    .addStringOption((option) =>
      option.setName('acronym').setDescription('The acronym for your round').setRequired(true)
    )
    .addStringOption((option) => option.setName('name').setDescription('The name for your round'))
    .addIntegerOption((option) =>
      option
        .setName('best_of')
        .setDescription('How many maps in a best of round')
        .setMinValue(1)
        .setMaxValue(21)
    )
    .addIntegerOption((option) =>
      option
        .setName('bans')
        .setDescription('How many bans each team is allowed in a round')
        .setMinValue(0)
        .setMaxValue(2)
    )
    .addBooleanOption((option) =>
      option
        .setName('show_mappool')
        .setDescription("Whether the round's mappool is visible to players or not")
    ),
  /**
   *
   * @param {import("discord.js").CommandInteraction} interaction
   * @returns
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let guild = await fetchGuild(interaction.guildId);
    let tournament = guild.active_tournament;

    let acronym = interaction.options.getString('acronym').toUpperCase();
    let round = await prisma.round.findFirst({
      where: { acronym: acronym, tournamentId: tournament.id },
    });
    let options = interaction.options.data[0].options[0].options;

    // In case the round doesn't exist
    if (round == null) {
      let embed = new EmbedBuilder()
        .setDescription(`**Err**: A round with the acronym ${acronym} does not exist.`)
        .setColor(Colors.Red);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    options.forEach((element) => {
      let prop = element.name;
      round[prop] = element.value;
    });

    await prisma.round.update({
      where: { id: round.id },
      data: round,
    });

    let embed = new EmbedBuilder()
      .setColor(tournament.color)
      .setTitle('Settings Updated')
      .setDescription(
        stripIndents`
                **${acronym}**: ${round.name}
				Best of **${round.best_of}**
				Bans: **${round.bans}**
				Mappool Visible: **${round.show_mappool}**
            `
      )
      .setThumbnail(tournament.icon_url);
    await interaction.editReply({ embeds: [embed] });
  },
};
