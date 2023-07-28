import { SlashCommandBuilder } from 'discord.js';
import { stripIndents } from 'common-tags/lib';
import { EmbedBuilder, version as djs } from 'discord.js';
import { version } from '../../../package.json';
// import { prisma } from '../../lib/prisma';
import { CommandInteraction } from 'discord.js';

const start_time = Date.now();

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Shows info about the bot');
export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();
  const uptime = Date.now() - start_time;
  const uptimeSplits = {
    days: Math.floor(uptime / (1000 * 60 * 60 * 24)),
    hours: Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    mins: Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60)),
    secs: Math.floor((uptime % (1000 * 60)) / 1000),
  };
  const uptimeString =
    (uptimeSplits.days != 0 ? `${uptimeSplits.days} days ` : '') +
    (uptimeSplits.hours != 0 ? `${uptimeSplits.hours} hrs ` : '') +
    (uptimeSplits.mins != 0 ? `${uptimeSplits.mins} mins ` : '') +
    (uptimeSplits.secs != 0 ? `${uptimeSplits.secs} secs` : '');

  // TODO: Right align text
  const matches =
    // await prisma.match.findMany();
    [];

  const embed = new EmbedBuilder()
    .setColor('#F88000')
    .setTitle('Yagami')
    .setDescription('A bot for managing tournaments')
    .setThumbnail('https://yagami.clxxiii.dev/static/yagami%20var.png')
    .addFields(
      {
        name: 'Version',
        value: stripIndents`
						> ➣ Bot Version: **${version}**
						> ➣ Node Version: **${process.versions.node}**
						> ➣ DJS Version: **${djs}**
					`,
      },
      {
        name: 'Latency',
        value: stripIndents`
					> ➣ Uptime: **${uptimeString}**
					> ➣ Response Time: **${Date.now() - interaction.createdTimestamp} ms**
					> ➣ API Latency: **${Math.round(interaction.client.ws.ping)} ms**
					`,
      },
      {
        name: 'Statistics',
        value: stripIndents`
					> ➣ Servers:  **${interaction.client.guilds.cache.size}**
					> ➣ Total Matches Tracked: **${matches.length}**
				`,
      },
      {
        name: 'Developer',
        value: stripIndents`
					<@265144290240495617>
					[Discord](https://yagami.clxxiii.dev/discord) | [Twitter](https://twitter.com/clxxiii1) | [GitHub](https://github.com/clxxiii) | [osu!](https://osu.ppy.sh/users/10962678)
					`,
      },
    )
    .setTimestamp()
    .setFooter({
      text: 'Made with ❤️',
      iconURL: 'https://clxxiii.dev/img/icon.png',
    });
  await interaction.editReply({ embeds: [embed] });
}
