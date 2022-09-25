/// <reference path="./types/declarations/discord.d.ts" />
import { ActivityType, Client, Collection, IntentsBitField, Partials } from "discord.js";
import { Handlers } from "./lib/classes/Handlers";
import { BaseCommand, BaseSlashCommand } from "./lib/structures/BaseCommand";
import { config } from "dotenv";
config()

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.User,
        Partials.Message,
        Partials.Reaction
    ],
    rest: {
        timeout: 30_000,
        retries: 3
    },
    presence: {
        activities: [
            {
                name: '$help',
                type: ActivityType.Watching
            }
        ],
        status: 'dnd'
    }
})
// ...

client.commands = new Collection<string, BaseCommand>()
client.slashCommands = new Collection<string, BaseSlashCommand>()
client.cooldowns = new Collection<string, Collection<string, number>>();

(async () => {
    const handler = new Handlers(client)
    await handler.handleCommands(undefined, true)
    await handler.handleSlashCommandsAndContextMenus(undefined, true)
    await client.login(process.env.TOKEN!).then(async () => {
        await handler.handleEvents(undefined, true)
    })
})()