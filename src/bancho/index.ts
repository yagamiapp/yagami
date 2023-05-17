import { initClient } from './client';
import { recover } from './recovery';

export function init() {
  initClient().then(() => {
    recover();
  });
}
