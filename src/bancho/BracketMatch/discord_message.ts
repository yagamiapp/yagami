/**
 * This function is essentially copy-pasted from the previous version of the program
 * As a result, it is ugly and hard to maintain, but it works and that's all I care
 * about.
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import { bot } from '../../discord';
import Match from './classes/Match';
import { emotes, states } from './config';
import { BracketMatch } from './match';
import { stripIndents } from 'common-tags';
import { BanchoLobby } from 'bancho.js';
import type { Beatmap } from 'nodesu';
import Team from './classes/Team';
import { convertEnumToAcro } from '../modEnum';

export const updateMessage = async (
  match: Match,
  lobby: BanchoLobby,
  scores?: BracketMatch.Score[],
  lastMap?: Beatmap,
) => {
  const { round, teams, tournament, state } = match;
  const { beatmap } = lobby;

  const channel = await bot.channels.fetch(match.channel_id);
  if (!channel.isTextBased()) throw 'Match Channel ID is Invalid';
  const message = await channel.messages.fetch(match.message_id);
  const oldembed = message.embeds[0];
  let description = '';
  const embed = new EmbedBuilder()
    .setTitle(`${round.acronym}: (${teams[0].name}) vs (${teams[1].name})`)
    .setColor(tournament.color as ColorResolvable)
    .setAuthor(oldembed.data.author)
    .setThumbnail(oldembed.data.thumbnail?.url)
    .setURL(match.mp_link)
    .setImage(oldembed.data.image?.url)
    .setFooter({ text: 'Current phase: ' + states[state] })
    .setTimestamp();

  // Score line
  if (state <= 2 || (state >= 5 && state <= 7)) {
    embed.addFields({
      name: 'Score',
      value: `
				${emotes.teams[0]} ${teams[0].name} | ${teams[0].score} - ${teams[1].score} | ${teams[1].name} ${emotes.teams[1]}`,
    });
  }

  // Remove img on setup phases
  if ([3, 5, 6, 7].includes(state)) {
    embed.data.image = null;
  }

  // Individual Score Table
  if (
    ([4, 5, 6, 7].includes(state) || match.wins.length >= 1) &&
    ![1, 9].includes(state) &&
    scores &&
    lastMap
  ) {
    let leaderboard = '';

    const { title, artist, version } = lastMap;
    const lastMapIdentifier =
      match.round.mappool.find((map) => map.mapdata.beatmap_id == `${lastMap.beatmapId}`)
        ?.identifier || 'Warmup';
    leaderboard += `**${lastMapIdentifier}**: ${title} - ${artist} [${version}]\n`;

    const teamStrings = {};
    for (const team of teams) {
      teamStrings[team.id] = { userScores: [] };
      teamStrings[team.id].team = team;
    }

    for (const score of scores) {
      // Get team of user from id
      const playerId = score.user.id;
      let team: Team;
      for (const teamTest of teams) {
        if (teamTest.members.find((u) => u.id == playerId)) {
          team = teamTest;
        }
      }
      const user = team.members.find((u) => u.id == playerId);

      const mods = convertEnumToAcro(score.score.enabledMods);

      // Calculate acc
      let accuracy =
        300 * score.score.count300 + 100 * score.score.count100 + 50 * score.score.count50;
      const divisor =
        300 *
        (score.score.count300 + score.score.count100 + score.score.count50 + score.score.countMiss);
      accuracy = accuracy / divisor;
      // Calculate grade
      let grade = '';
      const percent300 =
        score.score.count300 /
        (score.score.count300 + score.score.count100 + score.score.count50 + score.score.countMiss);
      const percent50 =
        score.score.count50 /
        (score.score.count300 + score.score.count100 + score.score.count50 + score.score.countMiss);

      if (score.score.countMiss == 0) {
        if (percent300 > 0.9) {
          if (percent50 < 0.1) {
            if (mods.includes('HD') || mods.includes('FL')) {
              grade = 'SH';
            } else {
              grade = 'S';
            }
          }
        } else if (percent300 > 0.8) {
          grade = 'A';
        } else if (percent300 > 0.7) {
          grade = 'B';
        }
      } else {
        if (percent300 > 0.9) {
          grade = 'A';
        } else if (percent300 > 0.8) {
          grade = 'B';
        } else if (percent300 > 0.6) {
          grade = 'C';
        }
      }
      if (accuracy == 1) {
        if (mods.includes('HD') || mods.includes('FL')) {
          grade = 'SSH';
        } else {
          grade = 'SS';
        }
      }

      if (grade == '') {
        grade = 'D';
      }
      if (!score.score.pass) {
        grade = 'F';
      }

      const userScore = [
        emotes.grades[grade],
        user.username,
        score.score.score.toLocaleString(),
        score.score.maxCombo.toLocaleString() + 'x',
        (accuracy * 100).toFixed(2) + '%',
        `${mods.filter((x) => x != '').length == 0 ? '' : '+' + mods.join('')}`,
      ];

      teamStrings[team.id].userScores.push(userScore);
    }

    for (const key in teamStrings) {
      const teamString = teamStrings[key];
      if (teamString.userScores?.length > 0) {
        let teamLb = `${emotes.teams[teamString.team.id]} **${teamString.team.name}**\n`;
        // TODO: Get max of each column and add spaces to align
        const maxes = [];
        for (let i = 1; i < teamString.userScores[0].length; i++) {
          maxes.push(getMaxLength(teamString.userScores, i));
        }

        for (const userScore of teamString.userScores) {
          const grade = userScore.splice(0, 1);
          const mods = userScore.splice(userScore.length - 1, 1);

          // Add spaces to align
          for (let i = 0; i < userScore.length; i++) {
            let prop = userScore[i];
            for (let j = prop.length; j < maxes[i]; j++) {
              prop += ' ';
            }
            userScore[i] = prop;
          }

          teamLb += `${grade} \`${userScore.join('` `')}\``;
          if (lastMapIdentifier.includes('FM') || lastMapIdentifier == 'Warmup') {
            teamLb += `${mods}\n`;
          } else {
            teamLb += '\n';
          }
        }
        leaderboard += teamLb + '\n';
      }
    }
    description += '\n' + leaderboard;
  }

  // Lobby Player List
  if (state == 1) {
    let leaderboard = '';

    const players = lobby.slots.filter((x) => x).map((x) => x.user.username);
    for (const team of teams) {
      const inLobbyPlayers = team.members.filter((x) => players.includes(x.username));

      leaderboard += `${emotes.teams[team.id]} **${team.name}**\n`;
      for (const user of inLobbyPlayers) {
        leaderboard += `\`${user.username}\`\n`;
      }
      leaderboard += '\n';
    }
    description += '\n' + leaderboard;
  }

  // Match In Progress
  if (state == 2) {
    description += `\n${emotes.loading} **Map in progress**: ${
      match.picks[match.picks.length - 1].identifier
    }`;
  }

  // Match Rolls
  if (state >= 5 && state <= 7) {
    description += '\n';

    for (const team of teams) {
      if (team.roll == null) return;

      description += `**${team.name}** rolled a **${team.roll}**\n`;
    }
  }

  // Beatmap Image
  if (beatmap) {
    embed.setImage(`https://assets.ppy.sh/beatmaps/${beatmap?.setId}/covers/cover.jpg`);
  }

  // Handle bans
  if (match.bans.length > 0) {
    let banString = '';
    const teamString = new Map<number, string>();
    for (const team of match.teams) {
      const teamBans = team.bans;
      if (teamBans.length > 0) {
        teamString.set(team.id, team.bans.map((x) => x.identifier).join(', '));
      }
    }

    console.log(teamString);
    banString = `
				${emotes.teams[0]} **${teams[0].name}:** ${teamString.get(teams[0].id) || ''}
				${emotes.teams[1]} **${teams[1].name}:** ${teamString.get(teams[1].id) || ''}
			`;

    embed.addFields({ name: 'Bans', value: banString });
  }
  // Handle Picks
  const picks = match.picks.sort((a, b) => a.pickNumber - b.pickNumber);

  if (teams[0].pick_order) {
    embed.addFields({
      name: 'First Pick',
      value: teams[teams[0].pick_order - 1].name,
    });
    let pickString = ``;
    for (const pick of picks) {
      if (!pick.picked) return;
      const string = `${emotes.teams[pick.won_by?.id] || emotes.loading} **${pick.identifier}**\n`;

      pickString += string;
    }
    embed.addFields({
      name: 'Picks',
      value: pickString || 'No picks yet',
    });
  }

  if (state == 0) {
    description += `${emotes.loading} **${teams[match.waiting_on].name}** is currently picking.`;
    embed.setThumbnail(teams[match.waiting_on].icon_url);
  }

  // If no match link
  if (state == -1) {
    if (match.mp_link) {
      embed.addFields({ name: 'Previous MP Link: ', value: match.mp_link });
    }
    embed
      .setTitle(`ARCHIVED: ${round.acronym}: (${teams[0].name}) vs (${teams[1].name})`)
      .setColor('#AAAAAA')
      .setURL(null)
      .setDescription(
        stripIndents`
				**This match has been archived. Please select one of the options below to continue**
				
				**Recover Match:** I will ask for a new mp link from the players, and the match will start where it left off

				**Delete Match:** The match will be deleted, this message will be kept for reference`,
      );
    embed.setImage(null);
    const recoverButton = new ButtonBuilder()
      .setCustomId('start_match?id=' + match.id + '&recover=true')
      .setLabel('Recover Match')
      .setStyle(ButtonStyle.Primary);
    const deleteButton = new ButtonBuilder()
      .setCustomId('delete_match?id=' + match.id)
      .setLabel('Delete Match')
      .setStyle(ButtonStyle.Danger);
    const components = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      recoverButton,
      deleteButton,
    );
    await message.edit({
      content: null,
      embeds: [embed],
      components: [components],
    });
    return;
  }

  // Warmup Phase
  if (state == 4) {
    if (!match.waiting_on) return;
    if (beatmap == null) {
      embed.setDescription(`${teams[match.waiting_on].name} is picking a warmup`);
      embed.setThumbnail(teams[match.waiting_on].icon_url);
    } else {
      embed.setDescription(
        `**Warmup:** ${beatmap.artist} -  ${beatmap.title} [${beatmap.version}]`,
      );
      embed.setImage(`https://assets.ppy.sh/beatmaps/${beatmap.setId}/covers/cover.jpg`);
    }
  }

  // Final Match Results
  if (state == 9) {
    // Bold name on scorepost
    if (teams[0].score > teams[1].score) {
      description = `
					${emotes.teams[0]} **${teams[0].name}** | ${teams[0].score} - ${teams[1].score} | ${teams[1].name} ${emotes.teams[1]}`;
      embed.setColor(teams[0].color as ColorResolvable);
      embed.setThumbnail(teams[0].icon_url);
    } else if (teams[0].score < teams[1].score) {
      description = `
					${emotes.teams[0]} ${teams[0].name} | ${teams[0].score} - ${teams[1].score} | **${teams[1].name}** ${emotes.teams[1]}`;
      embed.setColor(teams[1].color as ColorResolvable);
      embed.setThumbnail(teams[1].icon_url);
    } else {
      description = `
					${emotes.teams[0]} ${teams[0].name} | ${teams[0].score} - ${teams[1].score} | ${teams[1].name} ${emotes.teams[1]}`;
    }
    embed.setFooter(null);
    embed.setImage(null);
  }

  if (description != '') {
    embed.setDescription(description);
  }
  await message.edit({ embeds: [embed] });
};

const getMaxLength = (obj: unknown[], index: number) => {
  let max = 0;
  for (const o of obj) {
    if (o[index].length > max) {
      max = o[index].length;
    }
  }
  return max;
};
