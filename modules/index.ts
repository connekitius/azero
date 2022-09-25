import { guildsModulesDb } from "../databases";
import { ChatInputCommandInteraction, Message } from "discord.js";
import { existsSync } from "fs";
import { resolve } from "path";
import { Module, Modules } from "../types/Module";

const modules = <Modules>{
	'tags': {
		requiredPermissions: ['ManageMessages'],
		description: 'Manage tags in your guild.'
	}
}

const createNewGuildSettingsProfile = (reciever: ChatInputCommandInteraction | Message) => {
	let arr = Object.keys(modules)
    if(!guildsModulesDb.has(reciever.guildId!)) guildsModulesDb.set(reciever.guildId!, {})
    if(guildsModulesDb.some(gMS => Object.keys(gMS).length <= 0 || Object.keys(gMS).some(s => !arr.includes(s)))) {
    	let guildModuleSettings = guildsModulesDb.find(gMS => Object.keys(gMS).length <= 0 || Object.keys(gMS).some(s => !arr.includes(s)))
    	if(!guildModuleSettings) return;
    	let filtered = Object.keys(guildModuleSettings).length > 0 ? Object.keys(guildModuleSettings).filter(s => !arr.includes(s)) : arr
    	for(const missing of filtered) {
    		if(!existsSync(resolve(resolve(), `./modules/${missing}/index.ts`))) return;
    		const obj: Module = require(resolve(resolve(), `./modules/${missing}/index.ts`))
    		guildsModulesDb.set(reciever.guildId!, {
    				status: obj.default ?? "DISABLED",
    				settings: {
    					requiredPermissions: modules[missing].requiredPermissions,
    					description: modules[missing].description
    			}
    		}, missing)
    	}
    }
    return arr;
}

export { modules, createNewGuildSettingsProfile }