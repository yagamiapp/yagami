import { stripIndents } from 'common-tags';
import {
  ChannelType,
  EmbedBuilder,
  Guild,
  GuildBasedChannel,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { deployCommands } from '../lib/deploy';
import { prisma } from '../lib/prisma';

export const joinHandler = async (guild: Guild) => {
  // Create guild db object
  await prisma.guild.upsert({
    where: {
      guild_id: guild.id,
    },
    create: {
      change_nickname: false,
      guild_id: guild.id,
    },
    update: {},
  });

  // Send welcome message
  const embed = new EmbedBuilder()
    .setTitle('Thanks for the invite!')
    .setThumbnail('https://yagami.clxxiii.dev/static/yagami%20var.png')
    .setColor('#F88000')
    .setDescription(
      stripIndents`
				Welcome to Yagami, the future of osu! tournaments.
				Yagami is many things, a discord bot, an auto ref, and even a website!
				Over the course of the past 2 months, this bot has continuously been in development
				I'll add more to this when I have something more profound to say

				**To continue setup, [head over to the website](https://yagami.clxxiii.dev)**
				`
    )
    .setTimestamp()
    .setFooter({
      text: 'Made with ❤️ by clxxiii',
      iconURL: 'https://clxxiii.dev/img/icon.png',
    })
    .addFields({
      name: 'Developer',
      value: stripIndents`
					<@265144290240495617>
					[Discord](https://yagami.clxxiii.dev/discord) | [Twitter](https://twitter.com/clxxiii1) | [GitHub](https://github.com/clxxiii) | [osu!](https://osu.ppy.sh/users/10962678)
					`,
    });
  const textChannels = guild.channels.cache.filter((x) => isGuildTextChannel(x));
  const channel = textChannels.find(
    (channel) =>
      channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages) &&
      channel.viewable
  );

  // Deploy new commands
  await deployCommands(guild, channel as TextChannel);

  try {
    await (channel as TextChannel).send({ embeds: [embed] });
  } catch (e) {
    console.log(`Cannot send welcome message to selected channel, ${channel.name}`);
  }
};

const isGuildTextChannel = (channel: GuildBasedChannel): channel is TextChannel => {
  return channel.type === ChannelType.GuildText;
};
