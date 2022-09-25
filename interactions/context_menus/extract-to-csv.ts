import { ContextMenuCommandBuilder, ApplicationCommandType, PermissionsBitField } from "discord.js";
import { BotContextMenu } from "../../types/ContextMenu";

export = <BotContextMenu>{
    payload: new ContextMenuCommandBuilder()
    .setType(ApplicationCommandType.Message)
    .setName('Extract to CSV')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .setDMPermission(false),
    guildOnly: [true, '993987482842570802']
}