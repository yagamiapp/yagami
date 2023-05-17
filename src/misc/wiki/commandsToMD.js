const fs = require('fs');

let guildCommands = [];

fs.readdirSync('./src/discord/commands')
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    let fileModule = require('../discord/commands/' + file);
    if (!fileModule.dontPushByDefault) guildCommands.push(fileModule.data);
  });

convertCommands(guildCommands);

/**
 *
 * @param {import("discord.js").SlashCommandBuilder[]} commands
 */
function convertCommands(commands) {
  let data = [];
  data.push(`\\* = required parameter`);
  data.push('# All Commands');
  data.push('| Command | Description | Parameters / Subcommands |');
  data.push('| ------- | ----------- | ------------------------ |');

  /**
   * @type {import("discord.js").SlashCommandBuilder[]}
   */
  let subCommands = {};
  for (const command of commands) {
    let string = `| **/${command.name}** | ${command.description} | `;

    command.options.forEach((option) => {
      if (option.toJSON().type == 1) subCommands[command.name] = command;

      string += `${option.toJSON().required != false ? '*' : '-'} **${option.toJSON().name}**: ${
        option.toJSON().description
      }<br>`;
    });

    data.push(string);
  }
  for (const key in subCommands) {
    let command = subCommands[key];
    let name = command.name.charAt(0).toUpperCase() + command.name.slice(1);
    data.push(`# ${name}`);
    data.push('| Command | Description | Parameters |');
    data.push('| ------- | ----------- | ---------- |');

    command.options.forEach((option) => {
      let subcommand = option.toJSON();
      let string = `| **/${command.name} ${subcommand.name}** | ${subcommand.description} | `;

      subcommand.options.forEach((option) => {
        string += `${option.required != false ? '*' : '-'} **${option.name}**: ${
          option.description
        }<br>`;
      });

      data.push(string);
    });
  }

  let out = '';
  data.forEach((line) => (out += line + '\n'));
  fs.writeFileSync('./wiki/out.md', out);
}
