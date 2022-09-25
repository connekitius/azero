import { randomUUID } from "crypto";
import Discord, { AttachmentBuilder, codeBlock, Colors, EmbedBuilder, inlineCode, MessageContextMenuCommandInteraction, Snowflake } from "discord.js";
import { Formatter, EolStyle } from "fracturedjsonjs";
import { readFileSync, unlinkSync } from "fs";
import { createNewGuildSettingsProfile, modules } from "../modules";
import { resolve } from "path";
import { CSV } from "../lib/classes/CSV";
import { Logger } from "../lib/classes/Logger";
import utils from "../lib/utils";
import { BotEvent } from "../types/BotEvent";
import { ModuleStatus } from "../types/Module";
import { guildsModulesDb } from "../databases";

const formatter = new Formatter();
formatter.maxInlineLength = 110;
formatter.maxInlineComplexity = 1;
formatter.maxCompactArrayComplexity = 1;
formatter.tableObjectMinimumSimilarity = 30;
formatter.tableArrayMinimumSimilarity = 50;
formatter.nestedBracketPadding = false;
formatter.simpleBracketPadding = false;
formatter.useTabToIndent = true;
formatter.jsonEolStyle = EolStyle.Crlf;

interface UsersIDCSVArr {
    id: Snowflake
}

export = <BotEvent<'interactionCreate'>>{
    name: 'interactionCreate',
    async payload(interaction) {
        if(interaction.isMessageContextMenuCommand()) {
            let cmI = interaction as MessageContextMenuCommandInteraction
            let msg = cmI.targetMessage
            if(cmI.commandName === 'Extract to CSV') {
                await cmI.deferReply()
                if(!msg.embeds || !msg.embeds.some(e => e.footer || e.description)) {
                    return cmI.followUp({
                        content: 'Message is not CSV-extractable.'
                    })
                }
                let embed = msg.embeds.find(e => e.footer && e.footer.text.includes('csv-')) 
                if(!embed || !embed.footer) return cmI.followUp({
                    content: 'Message is not CSV-extractable.'
                })
                const type = embed.footer.text.split(' ').find(s => s.includes('csv-'))
                if(!type) return cmI.followUp({
                    content: 'Message is not CSV-extractable.'
                })

                try {
                    switch(type.split('-')[1]) {
                        case null:
                        case undefined:
                            cmI.followUp({
                                content: 'Message is not CSV-extractable.'
                            })
                            break;
                        
                        case 'USR':
                            if(!embed.description) {
                                cmI.followUp({
                                    content: 'Message is not CSV-extractable.'
                                })
                                break;
                            }
                            try {
                                let resolver = new CSV()
                                let mapped = embed.description.replace(/`/gi, '').replace(/\n/gi, ',').split(',').map(s => <UsersIDCSVArr>{ id: s })
                                let key = randomUUID()
                                resolver.writeCsv(mapped, ['id'], `usrCSV-${key}`)
                                utils.delay(5000, undefined).promise.then(async () => {
                                    const attachment = new AttachmentBuilder(readFileSync(resolve(resolve(), `./.tmp/usrCSV-${key}.csv`)), {
                                        name: `usrCSV-${key}.csv`
                                    })
                                    await cmI.followUp({
                                        content: `Piped ${mapped.length} records from ${cmI.targetMessage.url} into ${inlineCode(`usrCSV-${key}`)}`,
                                        files: [
                                            attachment
                                        ]
                                    })
                                    unlinkSync(resolve(resolve(), `./.tmp/usrCSV-${key}.csv`))
                                })
                            } catch (err) {
                                cmI.followUp(`Failed to pipe/write CSV records:\n${codeBlock('bash', `${err}`)}`)
                                return Logger.logError(`${err}`)
                            }
                        }
                    } catch (err) {
                        cmI.followUp(`Failed to identify CSV type:\n${codeBlock('bash', `${err}`)}`)
                        return Logger.logError(`${err}`)
                    }
                }
            if(cmI.commandName === 'Read from CSV') {
                await cmI.deferReply()
                if(!msg.attachments || !msg.attachments.some(a => !utils.isUndefined(a.name) && !utils.isNull(a.name) && ['usrCSV'].some(s => a.name!.startsWith(s)))) {
                    return cmI.followUp({
                        content: 'Message does not contain any readable CSV attachments.'
                    })
                }
                if(msg.attachments.some(a => !utils.isUndefined(a.name) && !utils.isNull(a.name) && ['usrCSV'].some(s => a.name!.startsWith(s)))) {
                    const attachment = msg.attachments.find(a => !utils.isUndefined(a.name) && !utils.isNull(a.name) && ['usrCSV'].some(s => a.name!.startsWith(s)))
                    if(!attachment) {
                        return cmI.followUp({
                            content: 'Message does not contain any readable CSV attachments.'
                        })
                    }
                    try {
                        let resolver = new CSV()
                        const link = attachment.url
                        let arr = attachment.name?.split('-')
                        arr?.shift()
                        let name = arr?.join('-').replace('.csv', '')
                        try {
                            await utils.downloadFile(link, resolve(resolve(), `./.tmp/usrCSV-${name}.csv`))
                            const dataRaw = await resolver.readCSV(`usrCSV-${name}`)
                            const dataExtracted = await resolver.readCSV(`usrCSV-${name}`, true)
                            const regex = /\[ "[0-9]{18,20}" ]/gm;
                            const found = formatter.serialize(dataRaw)!.match(regex)!.map(m => m.replace(/ /gm, ''));
                            const embed = new EmbedBuilder()
                            .setColor('#8c59a4')
                            .setTitle(`Results ${dataRaw.length !== dataExtracted.length ? `(${dataRaw.length} Raw | ${dataExtracted} Extracted)` : `(${dataRaw.length || dataExtracted.length} Elements)`}`)
                            .addFields([
                                {
                                    name: 'Raw',
                                    value: codeBlock('js', `[
${found.map(f => `\t${f}`).join(`,\n`)}
]`)
                                },
                                {
                                    name: 'Extracted',
                                    value: codeBlock('js', JSON.stringify(dataExtracted, null, "\t"))
                                },
                                {
                                    name: 'Joined Extracted',
                                    value: codeBlock('js', dataExtracted.join(','))
                                }
                            ])
                            .setFooter({
                                iconURL: cmI.client.user?.displayAvatarURL(),
                                text: `Azero - Moderation, expanded. | csv-USR`
                            });

                            await cmI.followUp({
                                embeds: [embed]
                            })
                            unlinkSync(resolve(resolve(), `./.tmp/usrCSV-${name}.csv`))
                        }
                        catch (err) {
                            return cmI.followUp({
                                content: `Failed to download CSV file:\n${codeBlock('bash', `${err}`)}`
                            })
                        }
                    } catch (err) {

                    }
                }
            }
        } else if(interaction.isChatInputCommand()) {
            await interaction.deferReply()
            const command = interaction.client.slashCommands.get(interaction.commandName);
            if (!command) return;
            try {
                if(Object.keys(modules).includes(command.name)) {
                    createNewGuildSettingsProfile(interaction)
                    let guildModuleSettings = guildsModulesDb.get(interaction.guildId!, command.name)
                    if(!guildModuleSettings) return;
                    if(guildModuleSettings.status === ModuleStatus.OFF) return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Red)
                            .setDescription(`This module (${inlineCode(utils.capitalize(command.name) + ' Module')}) is disabled. You can turn it on by running:
                                ${inlineCode(`$modules enable ${command.name.toLowerCase()}`)}`)
                            .setFooter({
                                iconURL: interaction.client.user?.displayAvatarURL(),
                                text: 'Azero - Moderation, expanded.'
                            })
                        ]
                    })
                }
                await command.run(interaction, Discord)
            } catch (err) {
                Logger.logError(`${err as Error}`)
                await interaction.reply({ content: '❌ Oopsies! An error occured whilst running this command.', ephemeral: true })
            }
        }
    }
}