import { ContextMenuCommandBuilder, Snowflake } from "discord.js";

export interface BotContextMenu {
    payload: ContextMenuCommandBuilder,
    guildOnly?: false | [true, Snowflake]
}