import { ChatInputCommandInteraction, Client, Message } from "discord.js";
import { BaseCommandInterface, CommandMetadata, SlashCommandGuildOnly, SlashCommandMetadata } from "../../types/Command"

export class BaseCommand implements BaseCommandInterface {
    filepath?: string
    name: string = ''
    metadata?: CommandMetadata | undefined;

    constructor(name: string, metadata: CommandMetadata = {}) {
        this.name = name;
        this['metadata'] = metadata;
    }

    async run(client: Client, message: Message, args: string[], discord: typeof import('discord.js')): Promise<any> {}
}

export class BaseSlashCommand {
    filepath?: string
    name: string = ''
    metadata: SlashCommandMetadata;
    guildOnly?: SlashCommandGuildOnly = false

    constructor(name: string, metadata: SlashCommandMetadata) {
        this.name = name;
        this['metadata'] = metadata;
    }

    async run(interaction: ChatInputCommandInteraction, discord: typeof import('discord.js')): Promise<any> {}
}