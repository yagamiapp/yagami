import { BanchoClient, BanchoMessage } from 'bancho.js';

export const name = 'help';
export const desc = 'Shows this message';
export const usage = '!help (command)';

export const exec = async (msg: BanchoMessage, options: string[], client: BanchoClient) => {
  await msg.user.sendMessage('Help Message');
};
