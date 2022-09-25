import { Client, Message } from "discord.js";
import { BaseCommand } from "../../lib/structures/BaseCommand";

export default class InviteCommand extends BaseCommand {
    constructor() {
        super('invite', {
            aliases: ['inv'],
            description: 'Gets the bot invite.',
            usage: 'invite'
        })
    }

    async run(client: Client<boolean>, message: Message<boolean>, args: string[], discord: typeof import("discord.js")): Promise<any> {
        const embed = new discord.EmbedBuilder()
    }
}