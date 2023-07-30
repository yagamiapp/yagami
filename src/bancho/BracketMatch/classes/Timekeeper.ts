/**
 * While this technically breaks the philosophy of the rewrite, by adding state to the server,
 * A meaningful or efficient workaround simply does not exist, so I think it's fair to
 * use this method of keeping track of timers.
 */

// This will delay the timer by a certain number to add some leniency
const timerPadding = 1000;

const timers = new Map<number, NodeJS.Timer>();

export const setTimer = (matchId: number, timeMS: number, fn: () => Promise<void> | void) => {
  const oldTimer = timers.get(matchId);
  if (oldTimer) {
    clearTimeout(oldTimer);
    timers.delete(matchId);
  }
  // Remove timer from map on use
  const timer = setTimeout(async () => {
    await fn();
    timers.delete(matchId);
  }, timeMS + timerPadding);
  timers.set(matchId, timer);
};
