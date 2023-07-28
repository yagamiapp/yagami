import { Colors, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../../lib/prisma";
import { joinChannel } from "../../bancho";
import { emotes } from "../../bancho/BracketMatch/config";
import { stripIndents } from "common-tags";

export const data = new SlashCommandBuilder()
  .setName("add-link")
  .setDescription('Sets the mp for your match and starts it!')
  .addStringOption(option => option
    .setName('link')
    .setDescription('The link to your match')
    .setRequired(true))

export const execute = async (interaction: CommandInteraction) => {
  await interaction.deferReply({ ephemeral: true });
  const match = await getMatchWithUser(interaction.user.id);
  let mpLink = interaction.options.get('link').value

  if (typeof mpLink !== 'string') throw "Literally how could you ever get this error."

  if (!match.id) {
    const embed = new EmbedBuilder()
      .setDescription(
        "**Err**: You are not in a match that requires an MP link."
      )
      .setColor(Colors.Red);
    return interaction.editReply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setTitle("Loading match")
    .setDescription(
      `${emotes.loading} We're currently setting up your match...`
    )
    .setColor("#F88000");
  await interaction.editReply({ embeds: [embed] });

  const mpId = mpLink.match(/\d+/)[0];
  mpLink = `https://osu.ppy.sh/community/matches/${mpId}`
  await prisma.match.update({
    where: {
      "id": match.id,
    },
    data: {
      mp_link: mpLink
    }
  })
  const joinSuccess = await joinChannel(parseInt(mpId), match.state)

  if (joinSuccess?.error) {
    console.log(joinSuccess.error);
    embed.setDescription(
      "**Err**: We encountered an error while joining the match"
    )
      .setColor(Colors.Red)
      .setFooter({
        text: "Make sure the lobby exists, and that you added the bot as a ref",
      });
    return await interaction.editReply({ embeds: [embed] });
  }

  embed
    .setTitle("Match loaded!")
    .setColor(Colors.Green)
    .setDescription(
      `${emotes.success} Check your invite message for more info`
    );
  interaction.editReply({ embeds: [embed] });

  const channel = await interaction.guild.channels.fetch(match.channel_id);
  if (!channel || !channel.isTextBased()) throw "Match Channel ID is invalid"
  const message = await channel.messages.fetch(match.message_id);
  if (!message) throw "Match Message ID is invalid"
  const oldembed = message.embeds[0];

  embed
    .setTitle(oldembed.title)
    .setColor(Colors.Green)
    .setAuthor(oldembed.author)
    .setThumbnail(oldembed.thumbnail?.url)
    .setURL(mpLink)
    .setDescription(
      stripIndents`
				Match link accepted!

				This match will be running the this lobby: 
				${mpLink}

				Sending invites to the players now...
			`
    )
    .setFooter({ text: "The match will start when the lobby is full" });
  message.edit({ content: null, embeds: [embed] });
}

const getMatchWithUser = (userId: string) => prisma.match.findFirst({
  where: {
    Teams: {
      some: {
        Team: {
          Members: {
            some: {
              User: {
                DiscordAccounts: {
                  some: {
                    id: userId
                  },
                },
              },
            },
          },
        },
      },
    },
    state: 3,
  },
});