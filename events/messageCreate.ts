import Discord, { Collection, Colors, EmbedBuilder, inlineCode, PermissionsString } from "discord.js";
import { modules, createNewGuildSettingsProfile } from "../modules";
import { Logger } from "../lib/classes/Logger";
import { BaseCommand } from "../lib/structures/BaseCommand";
import utils from "../lib/utils";
import { BotEvent } from "../types/BotEvent";
import { guildsModulesDb } from "../databases";
import { GuildModuleSettings, ModuleStatus } from "../types/Module";

export = <BotEvent<'messageCreate'>>{
    name: 'messageCreate',
    payload: (message) => {
        const prefix =  process.env.PREFIX ?? '$'
        
        if(!message.content.startsWith(prefix) || message.author.bot || !message.member) return;
        if(!message.guild) return;
        
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const command = args.shift()?.toLowerCase();

        if(!command) return;
        const cmd = (message.client.commands as Collection<string, BaseCommand>).find((c: BaseCommand) => c.name === command) 
                    || (message.client.commands as Collection<string, BaseCommand>).find((c: BaseCommand) => c.metadata !== undefined && c.metadata.aliases !== undefined && c.metadata.aliases.includes(command))
        if(!cmd) return;

        try {
            if(args[0] && cmd.metadata && cmd.metadata.subcommands && cmd.metadata.subcommands.some(s => s.name.toLowerCase() === args[0].toLowerCase() && s.metadata && s.metadata.requiredPermissions)) {
                let sCmd = cmd.metadata.subcommands.find(s => s.name.toLowerCase() === args[0].toLowerCase() && s.metadata && s.metadata.requiredPermissions)
                if(!sCmd || sCmd == null) return;
                if(utils.getSomeOfMissingValues<PermissionsString>(sCmd.metadata!.requiredPermissions!, message.member.permissions.toArray()) && message.author.id !== process.env.DEV_ID!) {
                    return message.reply(`You do not have enough permissions to run the following subcommand.
                        Required permissions: ${utils.getMissingValues<PermissionsString>(sCmd.metadata!.requiredPermissions!, message.member.permissions.toArray()).map(p => inlineCode(p.toString())).join(', ')}`)
                }
            }

            if(cmd.metadata && cmd.metadata.requiredPermissions && utils.getSomeOfMissingValues(cmd.metadata.requiredPermissions, message.member.permissions.toArray()) && message.author.id !== process.env.DEV_ID!) return message.reply(`You do not have enough permissions to run the following subcommand.
                        Required permissions: ${utils.getMissingValues<PermissionsString>(cmd.metadata.requiredPermissions, message.member.permissions.toArray()).map(p => inlineCode(p.toString())).join(', ')}`)
            

            if(args[0] && cmd.metadata && cmd.metadata.subcommands && cmd.metadata.subcommands.some(s => s.name.toLowerCase() === args[0].toLowerCase() && s.metadata && s.metadata.requiredDeveloper)) return message.reply('This subcommand is restricted to developers only!')
            if(cmd.metadata && cmd.metadata.requiredDeveloper && message.author.id !== process.env.DEV_ID!) return message.reply('This command is restricted to developers only!')


            if(Object.keys(modules).includes(cmd.name)) {
                createNewGuildSettingsProfile(message)
                let guildModuleSettings = guildsModulesDb.get(message.guildId!, cmd.name) as GuildModuleSettings[typeof cmd.name] | undefined
                if(!guildModuleSettings) return;
                if(guildModuleSettings.status = ModuleStatus.OFF) return message.reply({
                    embeds: [
                        new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setDescription(`This module (${inlineCode(utils.capitalize(Object.keys(modules[cmd.name])[0]))}) is disabled. You can turn it on by running:
                            ${inlineCode(`${prefix}modules enable ${Object.keys(modules[cmd.name])[0].toLowerCase()}`)}`)
                        .setFooter({
                            iconURL: message.client.user?.displayAvatarURL(),
                            text: 'Azero - Moderation, expanded.'
                        })
                    ]
                })
            }
            cmd.run(message.client, message, args, Discord)
        } catch (err) {
            Logger.logError(`${err as Error}`)
            message.reply('❌ Oopsies! An error occured whilst running this command.')
        }
    }
}