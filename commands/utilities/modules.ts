import { Client, inlineCode, Message, PermissionsString } from "discord.js";
import { guildsModulesDb } from "../../databases";
import { BaseCommand } from "../../lib/structures/BaseCommand";
import utils from "../../lib/utils";
import { modules, createNewGuildSettingsProfile } from "../../modules";
import { GuildModuleSettings, ModuleStatus } from "../../types/Module";


export default class ModulesCommand extends BaseCommand {
	constructor() {
		super('modules', {
			subcommands: [
				{
					name: 'enable',
					metadata: {
						aliases: ['on'],
						requiredPermissions: ['ManageGuild']
					}
				},
				{
					name: 'disable',
					metadata: {
						aliases: ['off'],
						requiredPermissions: ['ManageGuild']
					}
				}
			],
			requiredPermissions: ['ManageGuild'],
			description: 'Manage modules in your server.'
		})
	}

	 async run(client: Client<boolean>, message: Message<boolean>, args: string[], discord: typeof import("discord.js")): Promise<any> {
	    let arr = createNewGuildSettingsProfile(message)
	    if(!arr) return;

	    if(args[0]) {
	    	switch(args[0].toLowerCase()) {
	    		case 'enable' || 'on':
	    			const possibleModule = args[1]
	    			if(!possibleModule || !Object.keys(modules).some(s => s.toLowerCase() === possibleModule.toLowerCase())) {
	    				return message.reply(`Invalid or unprovided module.
	    					List of modules: ${Object.keys(modules).map(m => inlineCode(m)).join(', ')}`)
	    			}

	    			let guildModuleSettings = guildsModulesDb.get(message.guildId!, possibleModule) as GuildModuleSettings[typeof possibleModule] | undefined
	    			if(!guildModuleSettings) return;

	    			if(guildModuleSettings.status === ModuleStatus.ON) {
	    				return message.reply(`This module is already enabled!`)
	    			}

	    			if(guildModuleSettings.settings && guildModuleSettings.settings.requiredPermissions && message.author.id !== process.env.DEV_ID!) {
	    				let req = guildModuleSettings.settings.requiredPermissions as PermissionsString[]
	    				if(utils.getSomeOfMissingValues(req, message.member!.permissions.toArray())) {
	    					return message.reply(`This module requires the following permissions from users wishing to enable it:
	    						${utils.getMissingValues(req, message.member!.permissions.toArray()).map(v => inlineCode(v.toString())).join(', ')}`)
	    				}
	    			}

	    			let obj: GuildModuleSettings[typeof possibleModule] = guildModuleSettings;
	    			obj.status = ModuleStatus.ON;
	    			console.log(obj)
	    			let check = guildsModulesDb.set(message.guildId!, obj, possibleModule)
	    			if(check.has(message.guildId!, `${possibleModule}.status`) && check.get(message.guildId!, possibleModule)!.status === ModuleStatus.ON) message.reply(`Successfully enabled module ${inlineCode(possibleModule.toLowerCase())}.`)
	    			else message.reply(`Failed to enable module ${inlineCode(possibleModule.toLowerCase())}`)
	    		break;


	    		case 'disable' || 'off':
	    			const possibleModule1 = args[1]
	    			if(!possibleModule1 || !Object.keys(modules).some(s => s.toLowerCase() === possibleModule1.toLowerCase())) {
	    				return message.reply(`Invalid or unprovided module.
	    					List of modules: ${Object.keys(modules).map(m => inlineCode(m)).join(', ')}`)
	    			}

	    			let guildModuleSettings1 = guildsModulesDb.get(message.guildId!, possibleModule1) as GuildModuleSettings[typeof possibleModule1] | undefined
	    			if(!guildModuleSettings1) return;

	    			if(guildModuleSettings1.status === ModuleStatus.OFF) {
	    				return message.reply(`This module is already disabled!`)
	    			}

	    			if(guildModuleSettings1.settings && guildModuleSettings1.settings.requiredPermissions && message.author.id !== process.env.DEV_ID!) {
	    				let req = guildModuleSettings1.settings.requiredPermissions as PermissionsString[]
	    				if(utils.getSomeOfMissingValues(req, message.member!.permissions.toArray())) {
	    					return message.reply(`This module requires the following permissions from users wishing to enable it:
	    						${utils.getMissingValues(req, message.member!.permissions.toArray()).map(v => inlineCode(v.toString())).join(', ')}`)
	    				}
	    			}

	    			let obj1: GuildModuleSettings[typeof possibleModule1] = guildModuleSettings1;
	    			obj1.status = ModuleStatus.OFF;
	    			let check1 = guildsModulesDb.set(message.guildId!, obj1, possibleModule1)
	    			if(check1.hasProp(message.guildId!, `${possibleModule1}.status`)) message.reply(`Successfully disabled module ${inlineCode(possibleModule1.toLowerCase())}.`)
	    			else message.reply(`Failed to disable module ${inlineCode(possibleModule1.toLowerCase())}`)
	    		break;
	    	}
	    } else if(!args[0]) {
	    	let guildModuleSettings = guildsModulesDb.get(message.guildId!)
	    	if(!guildModuleSettings) return;
	    	const embed = new discord.EmbedBuilder()
	    	.setColor('#8c59a4')
	    	.setTitle('Azero Modules')
            .setDescription(`${arr.map(a => `${guildModuleSettings![a].status === "ENABLED" ? inlineCode('🟢') : inlineCode('🔴')} ~ ${utils.capitalize(a)}`).join('\n')}`)
            .setFooter({
                iconURL: client.user?.displayAvatarURL(),
                text: 'Azero - Moderation, expanded.'
            });
            message.reply({ embeds: [embed] });
	    }
	 }
}