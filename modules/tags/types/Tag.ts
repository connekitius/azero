import { Snowflake, User } from "discord.js";

export interface TagUUID extends String {}

export interface Tag {
	name: string;
	content: string;
	id: string;
	author: User;
	createdAt: Date;
	pinned?: boolean;
}

export interface TagOptions {
	name: string | null;
	content: string;
	createdAt?: Date;
}

export enum TagCommandMentions {
	CREATE = '</tags create:1013820781526003712>',
	LIST = '</tags list:1013820781526003712>',
	VIEW = '</tags view:1013820781526003712>',
	PIN = '</tags pin:1013820781526003712>'
}

export type TagKey = `tag_${Snowflake}_${number}`
