/// <reference path="../../types/declarations/discord.d.ts" />
import { APIEmbedField, Client, Collection, inlineCode, Message, RestOrArray } from "discord.js";
import path from "path";
import { BaseCommand } from "../../lib/structures/BaseCommand";
import utils from "../../lib/utils";
import { BaseCommandInterface } from "../../types/Command";

export default class HelpCommand extends BaseCommand {
    constructor() {
        super('help', {
            aliases: ['h'],
            usage: 'help [command] [subcommand]',
            examples: [
                'help',
                'help users',
                'help users find'
            ]
        })
    }

    async run(client: Client<boolean>, message: Message<boolean>, args: string[], discord: typeof import("discord.js")): Promise<any> {
        if(!args[0]) {
            const embed = new discord.EmbedBuilder()
            .setColor('#8c59a4')
            .setTitle('Azero Commands')
            .setDescription(`Lorem ipsum.`)
            .setFooter({
                iconURL: client.user?.displayAvatarURL(),
                text: 'Azero - Moderation, expanded.'
            })

            const commands: Collection<string, BaseCommandInterface> = client.commands;
            let arranged: [string, BaseCommand[]][] = []
            // arranged = [[category name, commands], [category name, commands], ...]
            let arr = Array.from(commands.values()).filter(cmd => !cmd.metadata?.requiredDeveloper)
            arr.forEach(cmd => {
                if(!arranged.some(a => a[0] === path.basename(path.dirname(cmd.filepath!)))) {
                    arranged.push([path.basename(path.dirname(cmd.filepath!)), [cmd]])
                } else if(arranged.some(a => a[0] === path.basename(path.dirname(cmd.filepath!)))) {
                    let existingArr = arranged.find(a => a[0] === path.basename(path.dirname(cmd.filepath!)))
                    if(!existingArr || existingArr === undefined) return;
                    existingArr = [existingArr[0], [...existingArr[1], cmd]]
                    let filtered = arranged.filter((v, _i, _a) => v[0] !== existingArr![0])
                    filtered.push(existingArr)
                    arranged = filtered
                }
            })
            arranged.forEach(cmdArr => {
                embed.addFields([
                    {
                        name: utils.capitalize(cmdArr[0]),
                        value: cmdArr[1].map(c => inlineCode(c.name)).join(', '),
                        inline: true
                    }
                ])
            })

            if (commands.some(c => !utils.isUndefined(c.metadata) && !utils.isUndefined(c.metadata.requiredDeveloper) && c.metadata.requiredDeveloper === true)) {
                let arr2 = Array.from(commands.values()).filter(cmd => cmd.metadata?.requiredDeveloper).map(cmd => `${path.basename(path.dirname(cmd.filepath || ''))}/${cmd.name}`)
                embed.addFields([
                    {
                        name: 'Developer',
                        value: arr2.map(s => inlineCode(s)).join(', '),
                        inline: true
                    }
                ])
            }

            message.reply({ embeds: [embed] })
        } else if(args[0]) {
            let cmd = client.commands.find(cmd => cmd.name === args[0].toLowerCase())
                    || client.commands.find(cmd => !utils.isUndefined(cmd.metadata) && !utils.isUndefined(cmd.metadata.aliases) && cmd.metadata.aliases.includes(args[0].toLowerCase()))
            if(!cmd) {
                return message.reply(`No command with name/alias ${inlineCode(args[0].toLowerCase())} found.`)
            }
            if(!args[1]) {
                const {
                    name,
                    metadata,
                    filepath
                } = cmd;
                if(!metadata) {
                    return message.reply(`No metadata found for command ${inlineCode(cmd.name)}.`)
                }

                const {
                    description,
                    requiredDeveloper,
                    requiredPermissions,
                    aliases,
                    usage,
                    cooldown,
                    examples,
                    subcommands
                } = metadata;

                const embed = new discord.EmbedBuilder()
                .setTitle(`${requiredDeveloper !== undefined && requiredDeveloper === true ? '🔧 ' : ''}${utils.capitalize(path.basename(path.dirname(filepath || '')))}: command **${name}**`)
                .setColor('#8c59a4')
                .setDescription(description || 'No description provided.')
                .setFooter({
                    iconURL: client.user?.displayAvatarURL(),
                    text: 'Azero - Moderation, expanded.'
                });

                const fields: RestOrArray<APIEmbedField> = []

                if(aliases) fields.push(
                    {
                        name: 'Aliases',
                        value: aliases.map(a => inlineCode(a)).join(', '),
                        inline: true
                    }
                )
                if(requiredPermissions) fields.push(
                    {
                        name: 'Required Permissions',
                        value: requiredPermissions.map(p => inlineCode(p)).join(', '),
                        inline: true
                    }
                )
                if(usage) {
                    if(Array.isArray(usage)) {
                        fields.push(
                            {
                                name: 'Usages',
                                value: usage.map(p => inlineCode(`${p.startsWith('$') ? p : `$${p}`}`)).join('\n'),
                                inline: true
                            }
                        )
                    } else if(typeof(usage) === 'string') {
                        fields.push(
                            {
                                name: 'Usage',
                                value:  inlineCode(`${usage.startsWith('$') ? usage : `$${usage}`}`),
                                inline: true
                            }
                        )
                    } else return;
                }
                if(examples) fields.push(
                    {
                        name: 'Examples',
                        value: examples.map(ex => inlineCode(`${ex.startsWith('$') ? ex : `$${ex}`}`)).join('\n'),
                        inline: true
                    }
                )
                if(subcommands) fields.push(
                    {
                        name: 'Subcommands',
                        value: subcommands.map(s => inlineCode(s.name)).join(', '),
                        inline: true
                    }
                )
                if(cooldown) fields.push(
                    {
                        name: 'Cooldown',
                        value: `${inlineCode(cooldown.toString())} seconds`,
                        inline: true
                    }
                )

                if(fields.length > 0) embed.addFields(fields)
                return message.reply({ embeds: [embed] })
            } else if(args[1]) {
                if(!cmd.metadata || !cmd.metadata.subcommands || !cmd.metadata.subcommands.some(s => s.name.toLowerCase() === args[1].toLowerCase())) {
                    return message.reply(`No subcommand of name/alias ${inlineCode(args[1].toLowerCase())} was found for command ${inlineCode(cmd.name)}.`)
                } else if(!utils.isUndefined(cmd.metadata) && !utils.isUndefined(cmd.metadata.subcommands) && cmd.metadata.subcommands.some(s => s.name.toLowerCase() === args[1].toLowerCase())) {
                    const scmd = cmd.metadata.subcommands.find(s => s.name.toLowerCase() === args[1].toLowerCase())
                    if(!scmd) return;
                    const {
                        name,
                        metadata
                    } = scmd;
                    if(!metadata) {
                        return message.reply(`No metadata found for command ${inlineCode(cmd.name)}.`)
                    }
    
                    const {
                        description,
                        requiredDeveloper,
                        requiredPermissions,
                        aliases,
                        usage,
                        cooldown,
                        examples,
                        subcommands
                    } = metadata;
    
                    const embed = new discord.EmbedBuilder()
                    .setTitle(`${requiredDeveloper !== undefined && requiredDeveloper === true ? '🔧 ' : ''}${utils.capitalize(path.basename(path.dirname(cmd.filepath || '')))}#${cmd.name}: subcommand **${name}**`)
                    .setColor('#8c59a4')
                    .setDescription(description || 'No description provided.')
                    .setFooter({
                        iconURL: client.user?.displayAvatarURL(),
                        text: 'Azero - Moderation, expanded.'
                    });
    
                    const fields: RestOrArray<APIEmbedField> = []
    
                    if(aliases) fields.push(
                        {
                            name: 'Aliases',
                            value: aliases.map(a => inlineCode(a)).join(', '),
                            inline: true
                        }
                    )
                    if(requiredPermissions) fields.push(
                        {
                            name: 'Required Permissions',
                            value: requiredPermissions.map(p => inlineCode(p)).join(', '),
                            inline: true
                        }
                    )
                    if(usage) {
                        if(Array.isArray(usage)) {
                            fields.push(
                                {
                                    name: 'Usages',
                                    value: usage.map(p => inlineCode(`${p.startsWith('$') ? p : `$${p}`}`)).join('\n'),
                                    inline: true
                                }
                            )
                        } else if(typeof(usage) === 'string') {
                            fields.push(
                                {
                                    name: 'Usage',
                                    value:  inlineCode(`${usage.startsWith('$') ? usage : `$${usage}`}`),
                                    inline: true
                                }
                            )
                        } else return;
                    }
                    if(examples) fields.push(
                        {
                            name: 'Examples',
                            value: examples.map(ex => inlineCode(`${ex.startsWith('$') ? ex : `$${ex}`}`)).join('\n'),
                            inline: true
                        }
                    )
                    if(subcommands) fields.push(
                        {
                            name: 'Subcommands',
                            value: subcommands.map(s => inlineCode(s.name)).join(', '),
                            inline: true
                        }
                    )
                    if(cooldown) fields.push(
                        {
                            name: 'Cooldown',
                            value: `${inlineCode(cooldown.toString())} seconds`,
                            inline: true
                        }
                    )
    
                    if(fields.length > 0) embed.addFields(fields)
                    return message.reply({ embeds: [embed] })
                } else return;
            } else return;
        } else return;
    }
}