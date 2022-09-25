import { Collection } from "discord.js";
import { BaseCommand, BaseSlashCommand } from "lib/structures/BaseCommand";

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, BaseCommand>,
        slashCommands: Collection<string, BaseSlashCommand>,
        cooldowns: Collection<string, Collection<string, number>>
    }
}