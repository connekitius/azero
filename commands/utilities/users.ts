import { Client, Message } from "discord.js";
import { BaseCommand } from "../../lib/structures/BaseCommand";

const switchMonth = (month: number) => {
    switch(month) {
        default:
        case 0:
            return 'January'

        case 1:
            return 'February'
            
        case 2:
            return 'March'
                
        case 3:
            return 'April'
            
        case 4:
            return 'May'

        case 5:
            return 'June'

        case 6:
            return 'July'

        case 7:
            return 'August'

        case 8:
            return 'September'

        case 9:
            return 'October'

        case 10:
            return 'November'

        case 11:
            return 'December'
    }
}

export default class UsersCommand extends BaseCommand {
    constructor() {
        super('users', {
            aliases: ['u'],
            usage: [
                'users'
            ],
            subcommands: [
                {
                    name: 'find',
                    metadata: {
                        usage: 'users find <{:mode=fdoi|ldoi|cd}, {:modeValue=...}> [{:view=normal|compact}, {:shownItems=...}]',
                        examples: [
                            'users find :mode=fdoi :modeValue=0123 :view=compact :shownItems=createdAt,joinedAt',
                            'users find :mode=ldoi :modeValue=7890 :view=normal :shownItems=tag,roles',
                            'users find :mode=cd :mode=#0001 :view=normal :shownItems=username,discriminator',
                            'users find :mode=cd :mode=#9999 :view=compact :shownItems=createdTimestamp,joinedTimestamp'
                        ]
                    }
                }
            ]
        })
    }

    async run(client: Client<boolean>, message: Message<boolean>, args: string[], discord: typeof import("discord.js")): Promise<any> {
        if(!args[0]) {
            const embed = new discord.EmbedBuilder()
            .setColor('#8c59a4')
            .setDescription(`~ 👤 ${message.guild!.members.cache.size} members
            ~ 🟢 ${message.guild!.members.cache.filter(m => !m.user.bot && m.presence !== undefined && m.presence!.status === 'online').size} online
            ~ 🟡 ${message.guild!.members.cache.filter(m => !m.user.bot && m.presence !== undefined && m.presence!.status === 'idle').size} idle
            ~ 🔴 ${message.guild!.members.cache.filter(m => !m.user.bot && m.presence !== undefined && m.presence!.status === 'dnd').size} do not disturb
            ~ ⚫ ${message.guild!.members.cache.filter(m => !m.user.bot && m.presence !== undefined && m.presence!.status === 'offline').size + message.guild!.members.cache.filter(m => m.presence !== undefined && m.presence!.status === 'invisible').size} offline/invisible
            ~ ❔ ${message.guild!.members.cache.filter(m => !m.user.bot && !m.presence || !m.presence!.status).size} unknown
            ~ 🤖 ${message.guild!.members.cache.filter(m => m.user.bot).size} bots`)
            .setFooter({
                iconURL: client.user?.displayAvatarURL(),
                text: 'Azero - Moderation, expanded.'
            })
            return message.reply({ embeds: [embed]})
        } else if(args[0] === 'find') {
            if(!args.some(arg => arg.startsWith(':mode'))) {
                return message.reply(`Please provide a mode from one of the following: \`normal\`, \`ffdi\`.`)
            }
            if(args.some(arg => arg.startsWith(':mode'))) {
                if(!args.some(arg => arg.startsWith(':modeValue'))) {
                    return message.reply(`Please provide a modeValue.`)
                }
                let arg = args[args.indexOf(args.find(arg => arg.startsWith(':mode'))!)]
                let components = arg.split('=')
                let modeValueArg = args[args.indexOf(args.find(arg => arg.startsWith(':modeValue'))!)]
                let modeValueComponents = modeValueArg.split('=')

                if(components[0] !== ':mode') return;
                if(modeValueComponents[0] !== ':modeValue') return;

                switch(components[1]) {
                    case 'fdoi':
                        let msg = await message.reply('Searching...')
                        let show = {
                            createdAt: false,
                            createdTimestamp: false,
                            joinedAt: true,
                            joinedTimestamp: false,
                            username: true,
                            discriminator: true,
                            tag: true,
                            roles: false
                        }

                        let compact = false;
                        let idOnly = false;

                        if(args.some(arg => arg.startsWith(':view'))) {
                            let viewArg = args[args.indexOf(args.find(arg => arg.startsWith(':view'))!)]
                            let viewComponents = viewArg.split('=')
                            if(viewComponents[0] !== ':view') return;
                            switch(viewComponents[1]) {
                                default:
                                case 'normal':
                                    compact = false;
                    

                                case 'compact':
                                    compact = true
                    
                            }
                        }

                        if(args.some(arg => arg.startsWith(':shownItems'))) {
                            let shownItemsArg = args[args.indexOf(args.find(arg => arg.startsWith(':shownItems'))!)]
                            let shownItemsComponents = shownItemsArg.split('=')
                            if(shownItemsComponents[0] !== ':shownItems') return;
                            let shownItemsVariables = shownItemsComponents[1].split(',')
                            
                            show = {
                                createdAt: false,
                                createdTimestamp: false,
                                joinedAt: false,
                                joinedTimestamp: false,
                                username: false,
                                discriminator: false,
                                tag: false,
                                roles: false
                            }
                            
                            if(shownItemsComponents[1] === 'nothing' || shownItemsComponents[1] === 'idOnly') {
                                show = show
                                idOnly = true
                            }
                            if(shownItemsVariables.includes('createdAt')) show.createdAt = true
                            if(shownItemsVariables.includes('createdTimestamp')) show.createdTimestamp = true
                            if(shownItemsVariables.includes('username')) show.username = true
                            if(shownItemsVariables.includes('joinedAt')) show.joinedAt = true
                            if(shownItemsVariables.includes('joinedTimestamp')) show.joinedTimestamp = true
                            if(shownItemsVariables.includes('discriminator')) show.discriminator = true
                            if(shownItemsVariables.includes('tag')) show.tag = true
                            if(shownItemsVariables.includes('roles')) show.roles = true
                        }

                        const foundUsers = message.guild!.members.cache.filter(
                            m => 
                            m.id.startsWith(Number(modeValueComponents[1]).toString())
                        )

                        if(foundUsers.size <= 0) {
                            return msg.edit('Found 0 users with defined attributes.')
                        } else if(foundUsers.size > 0) {
                            const newFoundUsers = foundUsers.map((m, _k, c) => {
                                let divider = compact === false ? '\n' : ' - '
                                if(idOnly === true) divider = ''
                                let str = `${c.first()!.id === m.id ? '' : '\n'}\`${m.id}\``
                                if(show.createdAt === true) str += `Created at: ${m.user.createdAt !== null ? `${m.user.createdAt?.getDate().toString()} ${switchMonth(m.user.createdAt?.getMonth())} ${m.user.createdAt?.getFullYear().toString()} ${m.user.createdAt?.toLocaleString('en-US', {
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                })}` : `N/A`}${divider}`
                                if(show.createdTimestamp === true) str += `Created at (timestamp): ${m.user.createdTimestamp}${divider}`
                                if(show.joinedAt === true) str += `Joined at: ${m.joinedAt !== null ? `${m.joinedAt?.getDate().toString()} ${switchMonth(m.joinedAt?.getMonth())} ${m.joinedAt?.getFullYear().toString()} ${m.joinedAt?.toLocaleString('en-US', {
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                })}` : `N/A`}${divider}`
                                if(show.joinedTimestamp === true) str += `Joined at (timestamp): ${m.joinedTimestamp}${divider}`
                                if(show.username === true) str += `Username: ${m.user.username}${divider}`
                                if(show.discriminator === true) str += `Discriminator: ${m.user.discriminator}${divider}`
                                if(show.tag === true) str += `Tag: ${m.user.tag}${divider}`
                                if(show.discriminator === true) str += `Roles: ${Array.from(m.roles.cache.values()).map(r => r.name).join(', ')}${divider}`
                                return str.endsWith(' - ') ? str.slice(0, -3) : str;
                            })

                            const embed = new discord.EmbedBuilder()
                            .setColor('#8c59a4')
                            .setDescription(newFoundUsers.join(''))
                            .setFooter({
                                iconURL: client.user?.displayAvatarURL(),
                                text: `Azero - Moderation, expanded. | csv-USR`
                            })

                            msg.edit({ content: `Found ${foundUsers.size} result${foundUsers.size > 1 ? 's' : ''}`, embeds: [embed] })
                        }

        

                    default:
                        return message.reply(`Please provide a mode from one of the following: \`normal\`, \`fdoi\`.`)

                }
            }
        }
    }
}