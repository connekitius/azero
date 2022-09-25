import { ChatInputCommandInteraction, Client, Interaction, Message, PermissionsString } from "discord.js"
import { modules } from '../modules'
const arr = Object.keys(modules);
type ModuleName = typeof arr[number];

export enum ModuleStatus {
	ON = 'ENABLED',
	OFF = 'DISABLED'
}

export interface Modules {
	[key: string]: {
		requiredPermissions?: PermissionsString[];
		description: string;
	}
}

export interface Module {
	name: string;
	default?: ModuleStatus;
	onRun<T extends Message | ChatInputCommandInteraction>(client: Client, messageOrInteraction: T, args: string[]): any
}

export interface GuildModuleSettings {
	[key: ModuleName]: {
		status: ModuleStatus;
		settings: Record<string, string | Object | Array<any>>
	}
}