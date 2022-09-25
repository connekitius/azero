import { ApplicationCommandType, ContextMenuCommandBuilder, PermissionsBitField } from "discord.js";
import { Logger } from "../lib/classes/Logger";
import { BotEvent } from "../types/BotEvent";

export = <BotEvent<'ready'>>{
    name: 'ready',
    payload: (client) => {
        new ContextMenuCommandBuilder()
        .setType(ApplicationCommandType.Message)
        .setName('Extract to CSV')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .setDMPermission(false)
        
        Logger.logInfo('Client logged in')
    },
    repeater: 'ONCE'
}