import { tagsDb } from "../../databases";
import { bold, Colors, EmbedBuilder, inlineCode, italic, Message } from "discord.js";
import { Module } from "../../types/Module";
import { checkIfTagExists, createTag, deleteTag, findTag, getTagsList, pinTag, SimilarTagNoForceError } from "./functions";
import { Tag, TagCommandMentions } from "./types/Tag";

function isSuccessfulTagCreation(arg: any): arg is [true, Tag] {
	return Array.isArray(arg) && arg[0] === true && typeof(arg[1]) === 'object'
}

function isMessage(arg: unknown): arg is Message {
	return arg instanceof Message;
}

let tagModule = <Module>{
	name: 'tags',
	default: 'DISABLED',
	onRun: async (client, messageOrInteraction, args) => {
		const prefix =  process.env.PREFIX ?? '$'
		switch(true) {
			case null || undefined:
				messageOrInteraction.reply(`Please refer to ${inlineCode(`${prefix}help tags`)} for more information about the tag command and its subcommands.`);
			break;

			case !['create', 'list', 'pin', 'delete', 'deleteAll'].includes(args[0]):
				if(isMessage(messageOrInteraction)) return;
				if(!messageOrInteraction.isChatInputCommand()) return;
				let c = checkIfTagExists(args[0].toLowerCase())
				if(c === false && messageOrInteraction && messageOrInteraction.isChatInputCommand()) {
					return messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Red)
							.setDescription(`No tag with ID/readable ID ${inlineCode(args[0].toLowerCase())} exists.`)
							.setFooter({
			                	iconURL: client.user?.displayAvatarURL(),
			                	text: 'Azero - Moderation, expanded.'
			            	})
						]
					})
				} else if(c === true && messageOrInteraction && messageOrInteraction.isChatInputCommand()) {
					const tag = findTag(args[0])
					if(!tag) return;
					messageOrInteraction.editReply(`${client.users.cache.some(u => u.id === args[1]) ? `${client.users.cache.find(u => u.id === args[1])!.toString()},\n` : ''}${italic(tag.content)}`)
				}
				break;


			case args[0].toLowerCase() === 'create':
				if(isMessage(messageOrInteraction)) return;
				if(!messageOrInteraction.isChatInputCommand()) return;
				let content = args[1]
				let name = args[2] !== null ? args[2] : null
				let forced = args[3] !== null ? args[3] === `true` ? true : false : false
				try {
					let user = messageOrInteraction.user
					if(!user || user == null) return;
					const check = createTag(user, messageOrInteraction.guildId!, {
						content: content,
						createdAt: new Date(),
						name: name
					}, forced)
					if(isSuccessfulTagCreation(check)) messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Green)
							.setDescription(`Succesfully created tag ${inlineCode(check[1].name)}.`)
							.setFooter({
				                iconURL: client.user?.displayAvatarURL(),
				                text: 'Azero - Moderation, expanded.'
				            })
						]
					})
					else messageOrInteraction.editReply('Failed to create tag.')
				} catch (err) {
					if(err instanceof SimilarTagNoForceError) return messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Red)
							.setDescription(err.message)
							.setFooter({
				                iconURL: client.user?.displayAvatarURL(),
				                text: 'Azero - Moderation, expanded.'
				            })
						]
					})
				}
			break;

			case args[0].toLowerCase() === 'list': {
				if(isMessage(messageOrInteraction)) return;
				if(!messageOrInteraction.isChatInputCommand()) return;
				let embed = new EmbedBuilder()
				.setColor('#8c59a4')
				.setTitle(`#️⃣  Tags in ${messageOrInteraction.guild!.name}`)
				.setFooter({
                	iconURL: client.user?.displayAvatarURL(),
                	text: 'Azero - Moderation, expanded.'
            	});

				let tags = getTagsList(client, messageOrInteraction.guildId!)
				if(!tags || tags.length <= 0) {
					embed.setTitle(null)
					embed.setColor(Colors.Red)
					embed.setDescription(`There are no tags in this server. Create a tag via ${TagCommandMentions.CREATE} or run ${inlineCode(`${prefix}help tags`)} from more information about the tag command and its subcommands.`);
					return messageOrInteraction.editReply({ embeds: [embed] })
				}
				if(args[1]) {
					switch(args[1]) {
						case 'newest_first':
							tags = tags.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf());
						break;

						case 'oldest_first':
							tags = tags.sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf());
						break;

						case 'newest_pinned':
							if(!tags.some(t => t.pinned && t.pinned === true)) {
								embed.setTitle(null)
								embed.setColor(Colors.Red)
								embed.setDescription(`There are no pinned tags in this server. Pin a tag via ${TagCommandMentions.PIN} or run ${inlineCode(`${prefix}help tags`)} from more information about the tag command and its subcommands.`);
								return messageOrInteraction.editReply({ embeds: [embed] })
							}
							tags = tags.filter(t => t.pinned !== undefined && t.pinned === true).sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf());
						break;

						case 'oldest_pinned':
							if(!tags.some(t => t.pinned && t.pinned === true)) {
								embed.setTitle(null)
								embed.setColor(Colors.Red)
								embed.setDescription(`There are no pinned tags in this server. Pin a tag via ${TagCommandMentions.PIN} or run ${inlineCode(`${prefix}help tags`)} from more information about the tag command and its subcommands.`);
								return messageOrInteraction.editReply({ embeds: [embed] })
							}
							tags = tags.filter(t => t.pinned !== undefined && t.pinned === true).sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf());
						break;
					}
				}
				let mapped = tags.map(t => `${bold(t.name)} ~ ${inlineCode(t.id)}`)
				embed.setDescription(mapped.join('\n'))
				messageOrInteraction.editReply({ embeds: [embed] })
			}
			break;

			case args[0].toLowerCase() === 'pin': {
				if(isMessage(messageOrInteraction)) return;
				if(!messageOrInteraction.isChatInputCommand()) return;
				let c = checkIfTagExists(args[1].toLowerCase())
				if(c === false && messageOrInteraction && messageOrInteraction.isChatInputCommand()) {
					return messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Red)
							.setDescription(`No tag with ID/readable ID ${inlineCode(args[1].toLowerCase())} exists.`)
							.setFooter({
			                	iconURL: client.user?.displayAvatarURL(),
			                	text: 'Azero - Moderation, expanded.'
			            	})
						]
					})
				} else if(c === true && messageOrInteraction && messageOrInteraction.isChatInputCommand()) {
					let check = pinTag(args[1].toLowerCase())
					if(check === true) messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Green)
							.setDescription(`Pinned tag ${inlineCode(findTag(args[1].toLowerCase())!.name)}.`)
							.setFooter({
				                iconURL: client.user?.displayAvatarURL(),
				                text: 'Azero - Moderation, expanded.'
				            })
						]
					})
				}
				break;
			}

			case args[0].toLowerCase() === 'delete': {
				if(isMessage(messageOrInteraction)) return;
				if(!messageOrInteraction.isChatInputCommand()) return;
				let c = checkIfTagExists(args[1].toLowerCase())
				if(c === false && messageOrInteraction && messageOrInteraction.isChatInputCommand()) {
					return messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Red)
							.setDescription(`No tag with ID/readable ID ${inlineCode(args[1].toLowerCase())} exists.`)
							.setFooter({
			                	iconURL: client.user?.displayAvatarURL(),
			                	text: 'Azero - Moderation, expanded.'
			            	})
						]
					})
				} else if(c === true && messageOrInteraction && messageOrInteraction.isChatInputCommand()) {
					let check = deleteTag(args[1].toLowerCase())
					if(check === true) messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Green)
							.setDescription(`Deleted tag ${inlineCode(args[1].toLowerCase())}.`)
							.setFooter({
				                iconURL: client.user?.displayAvatarURL(),
				                text: 'Azero - Moderation, expanded.'
				            })
						]
					})
				}
			}

			case args[0].toLowerCase() === 'deleteAll': {
				if(isMessage(messageOrInteraction)) return;
				if(!messageOrInteraction.isChatInputCommand()) return;
				if(messageOrInteraction.user.id !== messageOrInteraction.guild!.ownerId) {
					return messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Red)
							.setDescription(`This subcommand is restricted to guild owners only.`)
							.setFooter({
				                iconURL: client.user?.displayAvatarURL(),
				                text: 'Azero - Moderation, expanded.'
				            })
						]
					})
				}
				console.log(args[1])
				if(args[1] === `${null}` || args[1] === `${false}`) {
					return messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Yellow)
							.setDescription(`Are you sure that you want to delete all tags in this guild? **This action is irreversible.**\nIf you are sure you want to delete all tags in this guild, run this command with ${inlineCode('force')} set to ${inlineCode('True')}.`)
							.setFooter({
				                iconURL: client.user?.displayAvatarURL(),
				                text: 'Azero - Moderation, expanded.'
				            })
						]
					})
				} else if(args[1] === `${true}`) {
					let count = getTagsList(messageOrInteraction.client, messageOrInteraction.guildId!).length
					tagsDb.deleteAll()
					messageOrInteraction.editReply({
						embeds: [
							new EmbedBuilder()
							.setColor(Colors.Green)
							.setDescription(`Deleted${count > 1 ? 'all ' : ''} ${count} ${count > 1 ? 'tags' : 'tag'} of ${inlineCode(messageOrInteraction.guild!.name)}.`)
							.setFooter({
				                iconURL: client.user?.displayAvatarURL(),
				                text: 'Azero - Moderation, expanded.'
				            })
						]
					})
				}
				break;
			}

		}
	}
}

export { tagModule }