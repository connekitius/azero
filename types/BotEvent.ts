import { Awaitable, ClientEvents } from "discord.js";

export interface BotEvent<event extends keyof ClientEvents> {
    name: event
    payload: (...args: ClientEvents[event]) => Awaitable<void>,
    repeater?: 'ONCE' | 'ON'
}