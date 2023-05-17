const { REST, Routes } = require('discord.js');
// const { Routes } = require("discord-api-types/v9");
const fs = require('fs');

/**
 *
 * @param {import("discord.js").Guild} guild
 */
module.exports.deployCommands = async (guild) => {
  let guildCommands = [];

  fs.readdirSync('./src/discord/commands')
    .filter((file) => file.endsWith('.js'))
    .forEach((file) => {
      let fileModule = require('./commands/' + file);
      if (!fileModule.dontPushByDefault) guildCommands.push(fileModule.data);
    });

  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

  rest
    .put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id), {
      body: guildCommands,
    })
    .then(() =>
      console.log(
        'Registered command(s) to ' +
          guild.id +
          ': ' +
          guildCommands.map((el) => {
            return el.name;
          })
      )
    )
    .catch(console.error);

  // I probably don't need this anymore but I'm leaving it here for now

  // /*
  //  * 	PERMISSION HANDLING
  //  */

  // // Get roles with admin perms & owner
  // let commandIDs = await rest.get(
  // 	Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guild.id)
  // );

  // let adminRoles = [];
  // for (let role of guild.roles.cache) {
  // 	if (role[1].permissions.has("ADMINISTRATOR")) adminRoles.push(role[0]);
  // }
  // let adminPerms = [];
  // adminRoles.forEach((role) => {
  // 	adminPerms.push({
  // 		id: role,
  // 		type: "ROLE",
  // 		permission: true,
  // 	});
  // });
  // let owner = guild.ownerId;
  // if (owner) adminPerms.push({ id: owner, type: "USER", permission: true });

  // // Assemble full perms object
  // let fullPermissions = [];
  // for (let command of commandIDs) {
  // 	if (!command.default_permission) {
  // 		let id = command.id;
  // 		fullPermissions.push({ id, permissions: adminPerms });
  // 	}
  // }

  // await guild.commands.permissions.set({ fullPermissions });
};
