import { APIApplicationCommandOptionChoice, ApplicationCommandOptionAllowedChannelTypes, ApplicationCommandOptionType, Client, LocalizationMap, Message, PermissionsString, Snowflake } from "discord.js";

export interface CommandMetadata {
    description?: string;
    aliases?: string[];
    usage?: string | string[];
    examples?: string[];
    subcommands?: CommandOptions[];
    cooldown?: number;
    requiredPermissions?: PermissionsString[];
    requiredDeveloper?: boolean;
}

export interface CommandOptions {
    name: string,
    metadata?: CommandMetadata
}

export interface BaseCommandInterface extends CommandOptions {
    filepath?: string;
    run(client: Client, message: Message, args: string[], discord: typeof import('discord.js')): Promise<any>;
}

export interface SlashCommandChoices {
    name: string
    name_localizations?: LocalizationMap
    value: string | number
}

export interface SlashCommandOptions {
    type: ApplicationCommandOptionType
    name: string,
    name_localizations?: LocalizationMap | null
    description: string,
    required?: boolean,
    choices?: APIApplicationCommandOptionChoice<any>[] | null
    options?: this[]
    channel_types?: ApplicationCommandOptionAllowedChannelTypes,
    value_length?: {
        min?: number,
        max?: number
    },
    length?: {
        min?: number,
        max?: number
    },
    autocomplete?: boolean
}

export interface OfficialSlashCommandOptions {
    type: ApplicationCommandOptionType
    name: string,
    name_localizations: LocalizationMap | null
    description: string,
    required?: boolean,
    choices: APIApplicationCommandOptionChoice<any>[] | null
    options?: this[]
    channel_types?: ApplicationCommandOptionAllowedChannelTypes,
    min_value?: number,
    max_value?: number,
    min_length?: number,
    max_length?: number
    autocomplete?: boolean
}

export interface SlashCommandMetadata {
    description: string,
    options?: SlashCommandOptions | SlashCommandOptions[]
}

export type SlashCommandGuildOnly = false | [true, Snowflake]