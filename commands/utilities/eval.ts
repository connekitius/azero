import { Client, codeBlock, inlineCode, Message } from "discord.js";
import { transpile } from "typescript";
import { BaseCommand } from "../../lib/structures/BaseCommand";
import utils from "../../lib/utils";

export default class EvalCommand extends BaseCommand {
    constructor() {
        super('eval', {
            usage: ['eval [{:mode=ts|async|ats/asyncts}] <code>'],
            requiredDeveloper: true
        })
    }
    
    async run(client: Client<boolean>, message: Message<boolean>, args: string[], discord: typeof import("discord.js")): Promise<any> {
        let ts = false;
        let async = false;
        let asyncTs = false;
        if(!args[0] || !args.join(' ')) {
            return message.reply('Please provide code to evaluate.')
        }
        let code = args.join(' ')
        if(args[0].startsWith(':mode')) {
            let arg = args[0]
            let components = arg.split('=')
            if(components[0] !== ':mode') return;
            switch(components[1]) {
                case 'ts':
                    ts = true;
                    break;

                case 'async':
                    async = true;
                    break;
                
                case 'asyncts':
                case 'ats':
                    asyncTs = true;
                    break;

                default:
                    return message.reply(`Invalid mode. Please enter one of the following: ${['ts', 'async', 'ats/asyncts'].map(s => inlineCode(s)).join(', ')}`)
            }

            let check = args.shift()
            if(!args[0] || args.length === 0) return message.reply('Please provide code to evaluate.')
            code = args.join(' ')
        }
        if(ts === true) {
            code = transpile(code)
            const evaled = eval(code)
            const cleaned = await utils.clean(client, evaled)
            return message.reply(codeBlock(`js`, `\n${cleaned}`))
        } else if(async === true) {
            const evaled = eval(`(async () => {
                ${code}
            })();`)
            const cleaned = await utils.clean(client, evaled)
            return message.reply(codeBlock(`js`, `\n${cleaned}`))
        } else if(asyncTs === true) {
            code = transpile(code)
            const evaled = eval(`(async () => {
                ${code}
            })();`)
            const cleaned = await utils.clean(client, evaled)
            return message.reply(codeBlock(`js`, `\n${cleaned}`))
        } else {
            const evaled = eval(code)
            const cleaned = await utils.clean(client, evaled)
            return message.reply(codeBlock(`js`, `\n${cleaned}`))
        }
    }
}