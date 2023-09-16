/**
 * This file controls and maintains that each event in a BracketMatch lobby is handled:
 * a) One at a time
 * b) In order
 * Such that bugs caused by command spam are fully eliminated.
 * 
 * Each match as it's own queue.
 */

import Queue from "queue";
import MatchPayloadBuilder from "./MatchPayloadBuilder";
import { payloadHandler } from "..";
import Match from "./Match";
import { BanchoMultiplayerChannel } from "bancho.js";
import { updateMessage } from "../discord_message";

type ReturnValue = Promise<MatchPayloadBuilder> | Promise<void> | MatchPayloadBuilder | void;

const q = new Queue({ concurrency: 1, autostart: true })

export const addTask = (match: Match, channel: BanchoMultiplayerChannel, command: () => ReturnValue) => {
  q.push(async () => {
    const payload = command(); // Logic Function
    await payloadHandler(payload, match, channel) // Set properties from logic function
    try {
      await updateMessage(match, channel.lobby);
    } catch (e) {
      console.log(e);
    }
  })
}
