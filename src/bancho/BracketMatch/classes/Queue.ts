/**
 * An automatically-emptying queue, which can take many asynchronous functions, and run them one after the other in order
 */

export default class Queue {
  ratelimit = 0;
  #queue: (() => Promise<void>)[] = [];
  #running = false;

  add(f: () => Promise<void>) {
    this.#queue.push(f);
    if (!this.#running) {
      this.#run().catch(console.error);
      this.#running = true;
    }
  }

  async #run() {
    if (this.#queue.length == 0) {
      this.#running = false;
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, this.ratelimit));
    const func = this.#queue.splice(0, 1)[0]
    await func()

    this.#run()
  }
}
