import { randomUUID } from "crypto"
import { Client, Snowflake, User } from "discord.js"
import { distance } from "fastest-levenshtein"
import utils from "../../lib/utils"
import { tagsDb } from "../../databases"
import { Tag, TagOptions, TagUUID } from "./types/Tag"
import Enmap from "enmap"

export class SimilarTagNoForceError extends Error {
  constructor(message?: string) {
    super(message)

    // set immutable object properties
    Object.defineProperty(this, 'message', {
      get() {
        return message;
      }
    });
    Object.defineProperty(this, 'name', {
      get() {
        return 'SimilarTagNoForceError';
      }
    });
    // capture where error occured
    Error.captureStackTrace(this, SimilarTagNoForceError);
    return this;
  }
}


export class InvalidValueError extends Error {
  constructor(message?: string) {
    super(message)

    // set immutable object properties
    Object.defineProperty(this, 'message', {
      get() {
        return message;
      }
    });
    Object.defineProperty(this, 'name', {
      get() {
        return 'InvalidValueError';
      }
    });
    // capture where error occured
    Error.captureStackTrace(this, InvalidValueError);
    return this;
  }
}

const determinePropertyUsesId = (nameOrId: TagUUID | string) => {
    return nameOrId.includes('-')
        && nameOrId.split('-').length === 5
        && nameOrId.split('-')[0] !== undefined && nameOrId.split('-')[0].length === 8
        && nameOrId.split('-')[1] !== undefined && nameOrId.split('-')[1].length === 4
        && nameOrId.split('-')[2] !== undefined && nameOrId.split('-')[2].length === 4
        && nameOrId.split('-')[3] !== undefined && nameOrId.split('-')[3].length === 4
        && nameOrId.split('-')[4] !== undefined && nameOrId.split('-')[4].length === 12
}

const checkIfTagExists = (nameOrId: TagUUID | string, enmap?: Enmap<string, Tag>) => {
    return (enmap ?? tagsDb).some(t => determinePropertyUsesId(nameOrId) ? t.id.toLowerCase() === nameOrId.toLowerCase() : (t.name ?? '').toLowerCase() === nameOrId.toLowerCase())
}

const findTag = (nameOrId: TagUUID | string) => {
    if(!checkIfTagExists(nameOrId)) return null
    return tagsDb.find(t => determinePropertyUsesId(nameOrId) ? t.id.toLowerCase() === nameOrId.toLowerCase() : (t.name ?? '').toLowerCase() === nameOrId.toLowerCase()) ?? null
}

const generateTagId = () => randomUUID()

const getNameFromDesc = (desc: string) => {
    return ((desc.split(' ').length > 1 ? desc.split(' ')[0] + `${utils.capitalize(desc.split(' ')![1].toLowerCase())}` : desc.split(' ')[0])).replace(/\s+/gm, '')
}

const createTag = (author: User, guildId: Snowflake, options: TagOptions, force: boolean = false) => {
    if(tagsDb.some(t => [0, 1, 2, 3].includes(distance(getNameFromDesc(t.content), getNameFromDesc(options.content)))) && force !== true) {
        let tag = tagsDb.find(t => [0, 1, 2, 3].includes(distance(getNameFromDesc(t.content), getNameFromDesc(options.content))))
        if(!tag) return false;
        throw new SimilarTagNoForceError(`Erm.. there is already a similar tag with that name/content (\`${tag.name}\`). If you are sure in persisting the creation of this tag, append \`:force\` at the end of the command.`)
    }
    if(!author.client.guilds.cache.some(g => g.id === guildId)) throw new InvalidValueError('Invalid guild ID or guild does not exist');
    try {
        const generated = generateTagId()
        let readable = getNameFromDesc(options.content)
        let enmap = tagsDb.set(`tag_${guildId}_${(tagsDb.size || 0) + 1}`, {
            name: options.name !== `${null}` ? `${options.name}` : readable,
            content: options.content,
            id: generated,
            author: author,
            createdAt: options.createdAt ?? new Date()
        })
        if(enmap.some(t => t.id === generated)) return [true, enmap.find(t => t.id === generated)!];
        else return false;
    } catch (err) {
        throw err as Error;
    }    
}   

const editTag = (nameOrId: TagUUID | string, mode: keyof TagOptions, value: string) => {
    if(!checkIfTagExists(nameOrId)) throw new InvalidValueError('Invalid tag ID or tag does not exist')
    const tag = findTag(nameOrId)
    if(!tag || tag == null) return false;
    switch(mode) {
        case 'content':
            try {
                tagsDb.set(tagsDb.findKey(t => t === tag)!, 'content', value)
                if(tagsDb.get(tagsDb.findKey(t => t === tag)!, 'content')! === value) return true;
                else return false;
            } catch (err) {
                throw err as Error;
            }

    }
    return false;
}

const pinTag = (nameOrId: TagUUID | string) => {
    if(!checkIfTagExists(nameOrId)) throw new InvalidValueError('Invalid tag ID or tag does not exist')
    tagsDb.set(tagsDb.findKey(t => t === findTag(nameOrId)!)!, true, 'pinned')
    if(tagsDb.get(tagsDb.findKey(t => t === findTag(nameOrId)!)!, 'pinned') === true) return true;
    else return false;
}

const unpinTag = (nameOrId: TagUUID | string) => {
    if(!checkIfTagExists(nameOrId)) throw new InvalidValueError('Invalid tag ID or tag does not exist')
    tagsDb.set(tagsDb.findKey(t => t === findTag(nameOrId)!)!, false, 'pinned')
    if(tagsDb.get(tagsDb.findKey(t => t === findTag(nameOrId)!)!, 'pinned') === true) return true;
    else return false;
}

const deleteTag = (nameOrId: TagUUID | string) => {
    if(!checkIfTagExists(nameOrId)) throw new InvalidValueError('Invalid tag ID or tag does not exist')
    let enmap = tagsDb.delete(tagsDb.findKey(t => t === findTag(nameOrId)!)!)
    if(!checkIfTagExists(nameOrId, enmap)) return true;
    else return false;
}

const getTagsList = (client: Client, guildId: Snowflake) => {
    if(!client.guilds.cache.some(g => g.id === guildId)) throw new InvalidValueError('Invalid guild ID or guild does not exist');
    return tagsDb.filterArray((_t, k) => k.startsWith(`tag_${guildId}`))
}

export { checkIfTagExists, findTag, generateTagId, createTag, editTag, pinTag, unpinTag, deleteTag, getTagsList }