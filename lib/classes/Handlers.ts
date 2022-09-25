import { REST, APIApplicationCommandOptionChoice, ApplicationCommandOptionType, Client, RESTPostAPIApplicationCommandsJSONBody, Routes, SlashCommandBuilder, Snowflake } from "discord.js";
import fs from "fs";
import path from "path";
import glob from "tiny-glob";
import { BotEvent } from "../../types/BotEvent";
import { SlashCommandGuildOnly, SlashCommandOptions } from "../../types/Command";
import { BotContextMenu } from "../../types/ContextMenu";
import { BaseCommand, BaseSlashCommand } from "../structures/BaseCommand";
import utils from "../utils";
import { Logger } from "./Logger";

interface DefaultImportable<T> {
    default: T
}

export class Handlers {
    constructor(private client: Client) {}

    async handleCommands(dir: string = path.resolve(), logging: boolean = false) {
        const commandsPath = path.resolve(dir, 'commands')
        const commandsArr = await glob(`${commandsPath}/**/*.*(ts|js)`)
        for(const command of commandsArr) {
            let file:BaseCommand = new ((<DefaultImportable<any>>await import(path.resolve(dir, command))).default)(BaseCommand)
            try {
                this.client.commands.set(file.name, file)
                if(logging) Logger.logInfo(`Registered command ${file.name} into collection`)
                if(!file.filepath) file.filepath = path.resolve(dir, command)
            } catch(err) {
                if(logging) Logger.logError(`Could not register command ${file.name || 'no name'}: ${err}`)
            }
        }
    }

    async handleEvents(dir: string = path.resolve(), logging: boolean = false) {
        const eventsPath = path.resolve(dir, 'events')
        const eventsArr = fs.readdirSync(eventsPath)
        for(const event of eventsArr) {
            const file:BotEvent<any> = require(path.resolve(eventsPath, event))
            try {
                switch(file.repeater) {
                    default:
                    case 'ON':
                        this.client.on(file.name, (...args) => file.payload(...args))
                        break;
    
                    case 'ONCE':
                        this.client.once(file.name, (...args) => file.payload(...args))
                        break;
                }
                if(logging) Logger.logInfo(`Registered event ${file.name} into listener`)
            } catch (err) {
                if(logging) Logger.logError(`Could not register event ${file.name || 'no name'}: ${err}`)
            }
        }
    }

    private validateSlashCommandOptions(options: SlashCommandOptions | SlashCommandOptions[]) {
        if(Array.isArray(options)) {
            let arr = []
            optionLoop:
            for(const option of options) {
                if(option.autocomplete && !option.choices || option.choices && ![ApplicationCommandOptionType.Integer, ApplicationCommandOptionType.Number, ApplicationCommandOptionType.String].includes(option.type)) {
                    arr.push(false)
                    continue optionLoop;
                }
                if(option.channel_types && option.type !== ApplicationCommandOptionType.Channel) {
                    arr.push(false)
                    continue optionLoop;
                }
                if(option.type === ApplicationCommandOptionType.SubcommandGroup && option.options && option.options.some(o => o.type === ApplicationCommandOptionType.SubcommandGroup)) {
                    arr.push(false)
                    continue optionLoop;
                }
                if(option.type === ApplicationCommandOptionType.Subcommand && option.options && option.options.some(o => o.type === ApplicationCommandOptionType.SubcommandGroup)) {
                    arr.push(false)
                    continue optionLoop;
                }
                if([option.value_length].some(v => !utils.isNullOrUndefined(v) && [v.min, v.max].some(v2 => !utils.isNullOrUndefined(v2))) && ![ApplicationCommandOptionType.Integer, ApplicationCommandOptionType.Number].includes(option.type)) {
                    arr.push(false)
                    continue optionLoop;
                }
                if([option.length].some(v => !utils.isNullOrUndefined(v) && [v.min, v.max].some(v2 => !utils.isNullOrUndefined(v2))) && option.type !== ApplicationCommandOptionType.String) {
                    arr.push(false)
                    continue optionLoop;
                }
                if([option.value_length].some(v => !utils.isNullOrUndefined(v) && [v.min, v.max].some(v2 => !utils.isNullOrUndefined(v2))) && option.type === ApplicationCommandOptionType.Number && [option.value_length].some(v => [v?.min, v?.max].some(v2 => !utils.isNullOrUndefined(v2) && utils.isFloat(v2)))) {
                    arr.push(false)
                    continue optionLoop;
                }
                if([option.value_length].some(v => !utils.isNullOrUndefined(v) && [v.min, v.max].some(v2 => !utils.isNullOrUndefined(v2))) && option.type === ApplicationCommandOptionType.Integer && [option.value_length].some(v => [v?.min, v?.max].some(v2 => !utils.isNullOrUndefined(v2) && Number.isSafeInteger(v2)))) {
                    arr.push(false)
                    continue optionLoop;
                }
                arr.push(true)
            }
            return arr;
        } else {
            let option = options;
            if(option.autocomplete && !option.choices || option.choices && ![ApplicationCommandOptionType.Integer, ApplicationCommandOptionType.Number, ApplicationCommandOptionType.String].includes(option.type)) {
                return false;
            }
            if(option.channel_types && option.type !== ApplicationCommandOptionType.Channel) {
                return false;
            }
            if(option.type === ApplicationCommandOptionType.SubcommandGroup && option.options && option.options.some(o => o.type === ApplicationCommandOptionType.SubcommandGroup)) {
                return false;
            }
            if([option.value_length, option.length].some(v => !utils.isNullOrUndefined(v) && [v.min, v.max].some(v2 => !utils.isNullOrUndefined(v2))) && ![ApplicationCommandOptionType.Integer, ApplicationCommandOptionType.Number, ApplicationCommandOptionType.String].includes(option.type)) {
                return false;
            }
            if([option.value_length].some(v => !utils.isNullOrUndefined(v) && [v.min, v.max].some(v2 => !utils.isNullOrUndefined(v2))) && option.type === ApplicationCommandOptionType.Number && [option.value_length, option.length].some(v => [v?.min, v?.max].some(v2 => !utils.isNullOrUndefined(v2) && Number.isSafeInteger(v2)))) {
                return false;
            }
            if([option.value_length].some(v => !utils.isNullOrUndefined(v) && [v.min, v.max].some(v2 => !utils.isNullOrUndefined(v2))) && option.type === ApplicationCommandOptionType.Integer && [option.value_length, option.length].some(v => [v?.min, v?.max].some(v2 => !utils.isNullOrUndefined(v2) && !Number.isSafeInteger(v2)))) {
                return false;                
            }
            return true;
        }
    }

    private addSubcommandOptions(cmd: SlashCommandBuilder, option: SlashCommandOptions) {
        cmd.addSubcommand(opt => {
            if(option.description) opt.setDescription(option.description)
            if(option.name) opt.setName(option.name)
            if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
            if(option.options) {
                option.options.forEach(opt2 => {
                    switch(opt2.type) {
                        case ApplicationCommandOptionType.Attachment:
                            opt.addAttachmentOption(opt => {
                                if(opt2.required) opt.setRequired(opt2.required)
                                if(opt2.description) opt.setDescription(opt2.description)
                                if(opt2.name) opt.setName(opt2.name)
                                if(opt2.name_localizations) opt.setNameLocalizations(opt2.name_localizations)
                                return opt;
                            })
                            break;

                        case ApplicationCommandOptionType.Boolean:
                            opt.addBooleanOption(opt => {
                                if(opt2.required) opt.setRequired(opt2.required)
                                if(opt2.description) opt.setDescription(opt2.description)
                                if(opt2.name) opt.setName(opt2.name)
                                if(opt2.name_localizations) opt.setNameLocalizations(opt2.name_localizations)
                                return opt;
                            })
                            break;

                        case ApplicationCommandOptionType.Channel:
                            opt.addChannelOption(opt => {
                                if(opt2.required) opt.setRequired(opt2.required)
                                if(opt2.description) opt.setDescription(opt2.description)
                                if(opt2.name) opt.setName(opt2.name)
                                if(opt2.name_localizations) opt.setNameLocalizations(opt2.name_localizations)
                                if(opt2.channel_types) opt.addChannelTypes(opt2.channel_types)
                                return opt;
                            })
                            break;

                        case ApplicationCommandOptionType.Integer:
                            opt.addIntegerOption(opt => {
                                if(opt2.required) opt.setRequired(opt2.required)
                                if(opt2.description) opt.setDescription(opt2.description)
                                if(opt2.name) opt.setName(opt2.name)
                                if(opt2.name_localizations) opt.setNameLocalizations(opt2.name_localizations)
                                if(opt2.choices) opt.addChoices(...opt2.choices)
                                if(opt2.choices && opt2.autocomplete) opt.setAutocomplete(opt2.autocomplete)
                                if(opt2.value_length && [opt2.value_length.min, opt2.value_length.max].some(v => !utils.isNullOrUndefined(v))) {
                                    if(opt2.value_length.min) opt.setMinValue(opt2.value_length.min)
                                    if(opt2.value_length.max) opt.setMaxValue(opt2.value_length.max)
                                }
                                return opt;
                            })
                            break;

                        case ApplicationCommandOptionType.Mentionable:
                            opt.addMentionableOption(opt => {
                                if(opt2.required) opt.setRequired(opt2.required)
                                if(opt2.description) opt.setDescription(opt2.description)
                                if(opt2.name) opt.setName(opt2.name)
                                if(opt2.name_localizations) opt.setNameLocalizations(opt2.name_localizations)
                                return opt;
                            })
                            break;

                        case ApplicationCommandOptionType.Number:
                            opt.addNumberOption(opt => {
                                if(opt2.required) opt.setRequired(opt2.required)
                                if(opt2.description) opt.setDescription(opt2.description)
                                if(opt2.name) opt.setName(opt2.name)
                                if(opt2.name_localizations) opt.setNameLocalizations(opt2.name_localizations)
                                if(opt2.choices) opt.addChoices(...opt2.choices)
                                if(opt2.choices && opt2.autocomplete) opt.setAutocomplete(opt2.autocomplete)
                                if(opt2.value_length && [opt2.value_length.min, opt2.value_length.max].some(v => !utils.isNullOrUndefined(v))) {
                                    if(opt2.value_length.min) opt.setMinValue(opt2.value_length.min)
                                    if(opt2.value_length.max) opt.setMaxValue(opt2.value_length.max)
                                }
                                return opt;
                            })
                            break;

                        case ApplicationCommandOptionType.Role:
                            opt.addRoleOption(opt => {
                                if(opt2.required) opt.setRequired(opt2.required)
                                if(opt2.description) opt.setDescription(opt2.description)
                                if(opt2.name) opt.setName(opt2.name)
                                if(opt2.name_localizations) opt.setNameLocalizations(opt2.name_localizations)
                                return opt;
                            })
                            break;

                        case ApplicationCommandOptionType.String:
                            opt.addStringOption(opt => {
                                if(opt2.required) opt.setRequired(opt2.required)
                                if(opt2.description) opt.setDescription(opt2.description)
                                if(opt2.name) opt.setName(opt2.name)
                                if(opt2.name_localizations) opt.setNameLocalizations(opt2.name_localizations)
                                if(opt2.choices) opt.addChoices(...opt2.choices)
                                if(opt2.choices && opt2.autocomplete) opt.setAutocomplete(opt2.autocomplete)
                                if(opt2.length && [opt2.length.min, opt2.length.max].some(v => !utils.isNullOrUndefined(v))) {
                                    if(opt2.length.min) opt.setMinLength(opt2.length.min)
                                    if(opt2.length.max) opt.setMaxLength(opt2.length.max)
                                }
                                return opt;
                            })
                            break;

                        case ApplicationCommandOptionType.User:
                            opt.addUserOption(opt => {
                                if(opt2.required) opt.setRequired(opt2.required)
                                if(opt2.description) opt.setDescription(opt2.description)
                                if(opt2.name) opt.setName(opt2.name)
                                if(opt2.name_localizations) opt.setNameLocalizations(opt2.name_localizations)
                                return opt;
                            })
                            break;
                        }
                        return opt2;
                    })
                }
                return opt;
        })
        return cmd;
    }

    private addSubcommandGroupOptions(cmd: SlashCommandBuilder, option: SlashCommandOptions) {
         cmd.addSubcommandGroup(opt => {
            if(option.description) opt.setDescription(option.description)
            if(option.name) opt.setName(option.name)
            if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
            if(option.options) {
                optionsLoop:
                for(const opt2 of option.options) {
                    if(opt2.type !== ApplicationCommandOptionType.Subcommand) {
                        continue optionsLoop;
                    }
                    this.addSubcommandOptions(cmd, opt2)    
                }
            }
            return opt;
        })
        return cmd;
    }

    private isGuildOnlySlashCommand(arg: unknown): arg is SlashCommandGuildOnly {
        return Array.isArray(arg) && arg[0] === true && typeof(arg[1]) === 'string'
    }

    async handleSlashCommandsAndContextMenus(dir: string = path.resolve(), logging: boolean = false) {
        const commandsPath = path.resolve(dir, 'interactions/slash')
        const commandsArr = await glob(`${commandsPath}/**/*.*(ts|js)`)
        let guildOnlyCmds: [RESTPostAPIApplicationCommandsJSONBody, Snowflake][] = []
        let globalCmds: RESTPostAPIApplicationCommandsJSONBody[] = []
        for(const command of commandsArr) {
            let file:BaseSlashCommand = new ((<DefaultImportable<any>>await import(path.resolve(dir, command))).default)(BaseCommand)
            try {
                let cmd = new SlashCommandBuilder()
                cmd.setName(file.name)
                cmd.setDescription(file.metadata.description)
                if(file.metadata.options) {
                    if(Array.isArray(file.metadata.options)) {
                        let statuses = []
                        optionsLoop:
                        for(const option of file.metadata.options) {
                            let check = this.validateSlashCommandOptions(option)
                            if(check === false) {
                                statuses.push(false)
                                continue optionsLoop;
                            }
                            switch(option.type) {
                                case ApplicationCommandOptionType.Attachment:
                                    cmd.addAttachmentOption(opt => {
                                        if(option.required) opt.setRequired(option.required)
                                        if(option.description) opt.setDescription(option.description)
                                        if(option.name) opt.setName(option.name)
                                        if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
                                        return opt;
                                    })
                                    break;

                                case ApplicationCommandOptionType.Boolean:
                                    cmd.addBooleanOption(opt => {
                                        if(option.required) opt.setRequired(option.required)
                                        if(option.description) opt.setDescription(option.description)
                                        if(option.name) opt.setName(option.name)
                                        if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
                                        return opt;
                                    })
                                    break;

                                case ApplicationCommandOptionType.Channel:
                                    cmd.addChannelOption(opt => {
                                        if(option.required) opt.setRequired(option.required)
                                        if(option.description) opt.setDescription(option.description)
                                        if(option.name) opt.setName(option.name)
                                        if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
                                        if(option.channel_types) opt.addChannelTypes(option.channel_types)
                                        return opt;
                                    })
                                    break;

                                case ApplicationCommandOptionType.Integer:
                                    cmd.addIntegerOption(opt => {
                                        if(option.required) opt.setRequired(option.required)
                                        if(option.description) opt.setDescription(option.description)
                                        if(option.name) opt.setName(option.name)
                                        if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
                                        if(option.choices) opt.addChoices(...option.choices)
                                        if(option.choices && option.autocomplete) opt.setAutocomplete(option.autocomplete)
                                        if(option.value_length && [option.value_length.min, option.value_length.max].some(v => !utils.isNullOrUndefined(v))) {
                                            if(option.value_length.min) opt.setMinValue(option.value_length.min)
                                            if(option.value_length.max) opt.setMaxValue(option.value_length.max)
                                        }
                                        return opt;
                                    })
                                    break;

                                case ApplicationCommandOptionType.Mentionable:
                                    cmd.addMentionableOption(opt => {
                                        if(option.required) opt.setRequired(option.required)
                                        if(option.description) opt.setDescription(option.description)
                                        if(option.name) opt.setName(option.name)
                                        if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
                                        return opt;
                                    })
                                    break;

                                case ApplicationCommandOptionType.Number:
                                    cmd.addNumberOption(opt => {
                                        if(option.required) opt.setRequired(option.required)
                                        if(option.description) opt.setDescription(option.description)
                                        if(option.name) opt.setName(option.name)
                                        if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
                                        if(option.choices) opt.addChoices(...option.choices.map(c => (c as APIApplicationCommandOptionChoice<number>)))
                                        if(option.choices && option.autocomplete) opt.setAutocomplete(option.autocomplete)
                                        if(option.value_length && [option.value_length.min, option.value_length.max].some(v => !utils.isNullOrUndefined(v) && Number.isSafeInteger(v))) {
                                            if(option.value_length.min) opt.setMinValue(option.value_length.min)
                                            if(option.value_length.max) opt.setMaxValue(option.value_length.max)
                                        }
                                        return opt;
                                    })
                                    break;

                                case ApplicationCommandOptionType.Role:
                                    cmd.addRoleOption(opt => {
                                        if(option.required) opt.setRequired(option.required)
                                        if(option.description) opt.setDescription(option.description)
                                        if(option.name) opt.setName(option.name)
                                        if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
                                        return opt;
                                    })
                                    break;

                                case ApplicationCommandOptionType.String:
                                    cmd.addStringOption(opt => {
                                        if(option.required) opt.setRequired(option.required)
                                        if(option.description) opt.setDescription(option.description)
                                        if(option.name) opt.setName(option.name)
                                        if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
                                        if(option.choices) opt.addChoices(...option.choices.map(c => (c as APIApplicationCommandOptionChoice<string>)))
                                        if(option.choices && option.autocomplete) opt.setAutocomplete(option.autocomplete)
                                        if(option.length && [option.length.min, option.length.max].some(v => !utils.isNullOrUndefined(v) && !utils.isFloat(v))) {
                                            if(option.length.min) opt.setMinLength(option.length.min)
                                            if(option.length.max) opt.setMaxLength(option.length.max)
                                        }
                                        return opt;
                                    })
                                    break;

                                case ApplicationCommandOptionType.Subcommand:
                                    this.addSubcommandOptions(cmd, option)
                                    break;

                                case ApplicationCommandOptionType.SubcommandGroup:
                                    this.addSubcommandGroupOptions(cmd, option)
                                break;

                                case ApplicationCommandOptionType.User:
                                    cmd.addUserOption(opt => {
                                        if(option.required) opt.setRequired(option.required)
                                        if(option.description) opt.setDescription(option.description)
                                        if(option.name) opt.setName(option.name)
                                        if(option.name_localizations) opt.setNameLocalizations(option.name_localizations)
                                        return opt;
                                    })
                                    break;
                            }
                        } 
                        if(file.guildOnly && this.isGuildOnlySlashCommand(file.guildOnly)) guildOnlyCmds.push([cmd.toJSON(), file.guildOnly[1]])
                        else globalCmds.push(cmd.toJSON())
                        this.client.slashCommands.set(file.name, file)    
                    }
                }
                const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!)
                const contextMenusPath = path.resolve(dir, 'interactions/context_menus')
                const contextMenusArr = fs.readdirSync(contextMenusPath)
                const contextMenusLoadedArr: BotContextMenu[] = []
                for(const contextMenu of contextMenusArr) {
                    const file:BotContextMenu = require(path.resolve(contextMenusPath, contextMenu))
                    contextMenusLoadedArr.push(file)
                }
                let guildOnlyContextMenus = contextMenusLoadedArr.filter(bCM => bCM.guildOnly !== undefined && Array.isArray(bCM.guildOnly))
                let globalContextMenus = contextMenusLoadedArr.filter(bCM => bCM.guildOnly === undefined && !Array.isArray(bCM.guildOnly))
        
                if(guildOnlyCmds.length > 0 && guildOnlyContextMenus.length > 0) {
                    try {
                        new Set([...guildOnlyCmds, ...guildOnlyContextMenus.map(bCM => bCM.guildOnly as [true, string])].map(v => v[1])).forEach(s => {
                            try {
                                rest.put(
                                    Routes.applicationGuildCommands(process.env.CLIENT_ID!, s),
                                    {
                                        body: [...guildOnlyCmds.filter(v => v[1] === s).map(v => v[0]), ...guildOnlyContextMenus.filter(v => (v.guildOnly as [true, string])[1] === s).map(bCM => bCM.payload.toJSON())]
                                    }
                                )
                                if(logging) Logger.logSuccess(`Loaded ${guildOnlyCmds.filter(v => v[1] === s).length} guild-only slash ${guildOnlyCmds.filter(v => v[1] === s).length > 1 ? 'commands' : 'command'} and ${guildOnlyContextMenus.length} context ${guildOnlyContextMenus.length > 1 ? 'menus' : 'menu'}`)
                            } catch (err) {
                                if(logging) Logger.logError(`Could not load ${guildOnlyCmds.filter(v => v[1] === s).length} guild-only slash ${guildOnlyCmds.filter(v => v[1] === s).length > 1 ? 'commands' : 'command'} and ${guildOnlyContextMenus.length} context ${guildOnlyContextMenus.length > 1 ? 'menus' : 'menu'}: ${(err as Error).stack}`)
                            }
                        })
                    } catch (err) {
                        if(logging) Logger.logError(`Could not load ${guildOnlyCmds.length} potenial guild-only slash ${guildOnlyCmds.length > 1 ? 'commands' : 'command'}: ${(err as Error).stack}`)                    
                    }
                }
                if(globalCmds.length > 0 && globalContextMenus.length > 0) {
                    try {
                        rest.put(
                            Routes.applicationCommands(process.env.CLIENT_ID!),
                            {
                                body: [...globalCmds, ...globalContextMenus.map(bCM => bCM.payload.toJSON())]
                            }
                        )
                        if(logging) Logger.logSuccess(`Loaded ${globalCmds.length} global slash ${globalCmds.length > 1 ? 'commands' : 'command'} and ${globalContextMenus.length} global context ${globalContextMenus.length > 1 ? 'menus' : 'menu'}`)
                    } catch(err) {
                        if(logging) Logger.logError(`Could not load ${globalCmds.length} global slash ${globalCmds.length > 1 ? 'commands' : 'command'} and ${globalContextMenus.length} global context ${globalContextMenus.length > 1 ? 'menus' : 'menu'}: ${(err as Error).stack}`)
                    }
                }
            } catch (err) {
                if(logging) Logger.logError(`Error handling slash commands: ${(err as Error).stack}`)
            }
        }
    }


    async handleContextMenus(dir: string = path.resolve(), logging: boolean = false) {
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!)
        const contextMenusPath = path.resolve(dir, 'interactions/context_menus')
        const contextMenusArr = fs.readdirSync(contextMenusPath)
        const contextMenusLoadedArr: BotContextMenu[] = []
        for(const contextMenu of contextMenusArr) {
            const file:BotContextMenu = require(path.resolve(contextMenusPath, contextMenu))
            contextMenusLoadedArr.push(file)
        }
        let guildOnlyContextMenus = contextMenusLoadedArr.filter(bCM => bCM.guildOnly !== undefined && Array.isArray(bCM.guildOnly))
        let globalContextMenus = contextMenusLoadedArr.filter(bCM => bCM.guildOnly === undefined && !Array.isArray(bCM.guildOnly))
        if(guildOnlyContextMenus.length > 0 && Array.isArray(guildOnlyContextMenus[0].guildOnly)) {
            try {
                rest.put(
                    Routes.applicationGuildCommands(this.client.user!.id, guildOnlyContextMenus[0].guildOnly[1]),
                    {
                        body: guildOnlyContextMenus.map(bCM => bCM.payload.toJSON())
                    }
                )
                if(logging) Logger.logSuccess(`Loaded ${guildOnlyContextMenus.length} guild-only context ${guildOnlyContextMenus.length > 1 ? 'menus' : 'menu'}`)
            } catch (err) {
                if(logging) Logger.logError(`Could not load ${guildOnlyContextMenus.length} guild-only context ${guildOnlyContextMenus.length > 1 ? 'menus' : 'menu'}: ${err}`)
            }
        }
        if(globalContextMenus.length > 0) {
            try {
                rest.put(
                    Routes.applicationCommands(this.client.user!.id),
                    {
                        body: globalContextMenus.map(bCM => bCM.payload.toJSON())
                    }
                )
                if(logging) Logger.logSuccess(`Loaded ${globalContextMenus.length} global context menus`)
            } catch (err) {
                if(logging) Logger.logError(`Could not load ${globalContextMenus.length} global context menus: ${err}`)
            }
        }
    }
}