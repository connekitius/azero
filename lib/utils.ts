import { Client } from "discord.js";
import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { inspect, promisify } from "util";
import { isPromise, isRegExp } from "util/types";
import fetch from "node-fetch";

export default {
    delay: (delay: number, value: any) => {
        let timeout: any;
        let _reject: any;
        const promise = new Promise((resolve, reject) => {
        _reject = reject;
        timeout = setTimeout(resolve, delay, value);
        });
        return {
            promise,
            cancel() {
                if (timeout) {
                clearTimeout(timeout);
                timeout = null;
                _reject();
                _reject = null;
                }
            }
        }
    },
    capitalize: (s: string) => (s && s[0].toUpperCase() + s.slice(1)) || "",
    clean: async (client: Client, text: string) => {
        if(isPromise(Promise.resolve(text))) text = (await (text as unknown as Promise<string>)) 
        if(typeof(text) !== 'string') text = inspect(text, { depth: 1 })

        text = text
            .replace(/`/g, '`' + String.fromCharCode(8203))
            .replace(/@/g, '@' + String.fromCharCode(8203))
        
        while(text.includes(client.token!)) {
            text.replace(client.token!, '[REDACTED]')
        }
        
        return text;
    },
    isUndefined: (arg: unknown): arg is undefined => {
        return arg === undefined;
    },
    isNull: (arg: unknown): arg is null => {
        return arg === null;
    },
    isNullOrUndefined: (arg: unknown): arg is null | undefined => {
        return arg == null;
    },
    isFloat: (n: unknown) => {
        return Number(n) === n && n % 1 !== 0;
    },
    downloadFile: async (url: string, path: string) => {
      const streamPipeline = promisify(pipeline);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`unexpected response ${response.statusText}`);
      }

      if(response == null || response.body == null) {
        throw new Error(`null body`)
      }

      await streamPipeline(response.body as unknown as NodeJS.ReadableStream, createWriteStream(path));
    },
    getMissingValues: <T extends any>(required: T[], available: T[]) => {
        return required.filter(r => !available.find(a => r === a));
    },
    getSomeOfMissingValues: <T extends any>(required: T[], available: T[]) => {
        return required.some(r => !available.find(a => r === a));
    },
    someFirstMatchingItem: (arr: Array<any>, match: RegExp | string) => {
        return arr.some(el => isRegExp(match) ? new RegExp(match).exec(el) === null ? false : true : el === match)
    },
    getFirstMatchingItem: (arr: Array<any>, match: RegExp | string) => {
        return arr.find(el => isRegExp(match) ? new RegExp(match).exec(el) === null ? false : true : el === match)
    },
    objectifyArray: (arr: Array<string>) => {
        
    }
}