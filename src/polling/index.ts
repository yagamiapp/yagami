import { readdirSync } from "fs";

export const init = async () => {
  const commandFiles = readdirSync('./src/polling')
    .filter((file) => file.endsWith('.ts'))
    .filter((file) => file != 'index.ts');

  for (const file of commandFiles) {
    const interval = await import(`./${file}`);
    setInterval(interval.onInterval, interval.pollingInterval)
  }
}
