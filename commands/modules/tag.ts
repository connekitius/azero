import { Client, Message } from "discord.js";
import { BaseCommand } from "../../lib/structures/BaseCommand";
import { tagModule } from "../../modules/tags";

export default class EvalCommand extends BaseCommand {
    constructor() {
        super('tags', {
            usage: ['tags <create|list> <...subcommand/variable options>'],
            requiredDeveloper: true
        })
    }

    async run(client: Client<boolean>, message: Message<boolean>, args: string[], _discord: typeof import("discord.js")): Promise<any> {
        tagModule.onRun(client, message, args)
    }
}