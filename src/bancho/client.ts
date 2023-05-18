import { BanchoClient } from 'bancho.js';
import { pmHandler } from './pmHandler';

const credentials = {
  username: process.env.BANCHO_USERNAME,
  password: process.env.BANCHO_PASSWORD,
  apiKey: process.env.BANCHO_API_KEY,
  limiterTimespan: 12000,
};
export const client = new BanchoClient(credentials);

export async function initClient() {
  await client.connect();
  console.log('Connected to Bancho!');

  client.on('PM', (msg) => {
    pmHandler(msg, client);
  });
}

export async function fetchUser(name: string) {
  return client.getUser(name);
}
