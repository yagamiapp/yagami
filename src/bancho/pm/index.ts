import { readdirSync } from 'fs';
import type { PrivateMessage } from 'bancho.js';

// Create collection of commands
const commandFiles = readdirSync('./src/bancho/pm')
  .filter((file) => file.endsWith('.ts'))
  .filter((file) => file != 'index.ts');

export const commands = new Map();
commandFiles.forEach(async (file) => {
  const command = await import('./' + file);
  commands.set(command.name, command);
});

export const pmHandler = async (msg: PrivateMessage) => {
  const client = msg.user.banchojs;

  if (msg.self) return;
  console.log(`[DM from ${msg.user.ircUsername}] >> ${msg.message}`);

  const commandRegex = /^!\w+/g;
  let message = msg.message;

  if (message.match(commandRegex)) {
    message = message.substring(1);
    const args = message.split(' ');

    if (args[0] == '!mp') return;

    const command = commands.get(args[0]);

    if (!command) return;

    const options: string[] = args.splice(1, 1);
    try {
      await command.exec(msg, options, client);
    } catch (e) {
      console.log(e);
      msg.user.sendMessage('We encountered an error: ' + e);
    }
  }
};