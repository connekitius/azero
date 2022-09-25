import { Snowflake } from "discord.js";
import Enmap from "enmap";
import { TagKey, Tag } from "./modules/tags/types/Tag";
import { GuildModuleSettings } from "./types/Module";

const tagsDb = new Enmap<TagKey | string, Tag>({
	name: 'tagsDb'
})

const guildsModulesDb = new Enmap<Snowflake, GuildModuleSettings>({
	name: 'guildsModulesDb'
})

export { tagsDb, guildsModulesDb };
