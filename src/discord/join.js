let deploy = require('./deploy-commands');
const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { prisma } = require('../lib/prisma');
const { stripIndents } = require('common-tags/lib');

module.exports = {
  /**
   *
   * @param {import("discord.js").Guild} guild
   */
  async onGuildJoin(guild) {
    deploy.deployCommands(guild);

    let guildObj = await prisma.guild.findMany({
      where: {
        guild_id: guild.id,
      },
    });
    if (!guildObj[0]) {
      prisma.guild
        .create({
          data: {
            guild_id: guild.id,
            change_nickname: true,
            linked_role: '',
            player_role: '',
          },
        })
        .catch((err) => console.log(err));
    }
    let embed = new EmbedBuilder()
      .setTitle('Thanks for the invite!')
      .setThumbnail('https://yagami.clxxiii.dev/static/yagami%20var.png')
      .setColor('#F88000')
      .setDescription(
        stripIndents`
				Welcome to Yagami, the future of osu! tournaments.
				Yagami is many things, a discord bot, an auto ref, and even a website!
				Over the course of the past 2 months, this bot has continuously been in development
				I'll add more to this when I have something more profound to say

				**Let's get your server up and running:**
				`
      )
      .addFields(
        {
          name: 'Set up your server settings:',
          value: `\`\`\`/settings\`\`\``,
        },
        {
          name: 'Link your account to your osu! account:',
          value: `\`\`\`/link\`\`\``,
        },
        {
          name: 'Set up your first tournament:',
          value: `\`\`\`/tournaments create\`\`\``,
        }
      )
      .setTimestamp()
      .setFooter({
        text: 'Made with ❤️ by clxxiii#8958',
        iconURL: 'https://clxxiii.dev/img/icon.png',
      });
    let channel = guild.channels.cache.find(
      (channel) =>
        channel.type === ChannelType.GuildText &&
        channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages) &&
        channel.viewable
    );
    try {
      await channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(`Cannot send welcome message to selected channel, ${channel.name}`);
    }
  },
  /**
   *
   * @param {import("discord.js").GuildMember} member
   */
  async onUserJoin(member) {
    if (member.user.bot) return;

    let guild = await getData('guilds', member.guild.id);
    if (!guild.settings.change_nickname) return;

    let userData = await getData('users', member.id);
    if (!userData) return;

    if (!member.manageable) return;

    await member.setNickname(userData.osu.username);

    let linkedRole = guild.settings.linked_role;
    if (!linkedRole) return;

    let linkedRoleObj = member.guild.roles.cache.get(linkedRole);
    if (!linkedRoleObj) await setData(null, 'guilds', member.guild.id, 'settings', 'linked_role');
    else await member.roles.add(linkedRoleObj);
  },
};
