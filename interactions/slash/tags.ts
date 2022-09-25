import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction } from "discord.js";
import { tagModule } from "../../modules/tags";
import { BaseSlashCommand } from "../../lib/structures/BaseCommand";
import { SlashCommandGuildOnly } from "../../types/Command";

export default class TagSlashCommand extends BaseSlashCommand {
	guildOnly?: SlashCommandGuildOnly | undefined = [true, '993987482842570802']

	constructor() {
		super('tags', {
			description: 'View, list, create, edit and delete tags in this guild.',
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'view',
					description: 'View a tag by its ID.',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'id',
							description: 'A tag ID.',
							required: true
						},
						{
							type: ApplicationCommandOptionType.User,
							name: 'user',
							description: 'A user (if you\'re referring this tag to a user).',
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'list',
					description: 'Get all tags in this guild.',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'show_by',
							description: 'Show the list values by a sorting/mode.',
							choices: [
								{
									value: 'newest_first',
									name: 'Newest First'
								},
								{
									value: 'oldest_first',
									name: 'Oldest First'
								},
								{
									value: 'newest_pinned',
									name: 'Newest Pinned'
								},
								{
									value: 'oldest_pinned',
									name: 'Oldest Pinned'
								}
							]
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'create',
					description: 'Create a new tag in this guild.',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'tag_content',
							description: 'The content of the tag.',
							required: true
						},
						{
							type: ApplicationCommandOptionType.String,
							name: 'tag_name',
							description: 'The name of the tag.'
						},
						{
							type: ApplicationCommandOptionType.Boolean,
							name: 'force_tag_creation',
							description: 'Whether to force the creation of a tag if a tag with similar content or name exists.'
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'pin',
					description: 'Pin a tag.',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'id',
							description: 'A tag ID.',
							required: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'delete',
					description: 'Delete a tag.',
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: 'id',
							description: 'A tag ID.',
							required: true
						}
					]
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'delete_all',
					description: 'Delete all tags in this guild.',
					options: [
						{
							type: ApplicationCommandOptionType.Boolean,
							name: 'force',
							description: 'Whether you want to run this subcommand with force.'
						}
					]
				}
			]
		})
	}

	async run(interaction: ChatInputCommandInteraction<CacheType>, _discord: typeof import("discord.js")): Promise<any> {
	    switch(interaction.options.getSubcommand(true)) {
	    	case 'view': {
		    	const val = interaction.options.getString('id', true)
		    	const user = interaction.options.getUser('user')
		    	tagModule.onRun<ChatInputCommandInteraction>(interaction.client, interaction, [val, `${user !== null ? user.id : null}`]);
	    	}
		    break;

		    case 'list':
		    	let arr = ['list']
		    	const showBy = interaction.options.getString('show_by')
		    	if(showBy !== null) arr.push(showBy)
		    	tagModule.onRun<ChatInputCommandInteraction>(interaction.client, interaction, arr)
		    	break;

		    case 'create':
		    	let name = interaction.options.getString('tag_name')
		    	let content = interaction.options.getString('tag_content', true)
		    	let forced = interaction.options.getBoolean('force_tag_creation')
		    	tagModule.onRun<ChatInputCommandInteraction>(interaction.client, interaction, ['create', content, `${name}`, `${forced}`])
		    	break;

		    case 'pin': {
		    	const val = interaction.options.getString('id', true)
		    	tagModule.onRun<ChatInputCommandInteraction>(interaction.client, interaction, ['pin', val])
		    	break;
		    }

		    case 'delete': {
		    	const val = interaction.options.getString('id', true)
		    	tagModule.onRun<ChatInputCommandInteraction>(interaction.client, interaction, ['delete', val])
		    	break;
		    }

		    case 'deleteAll': {
		    	let forced = interaction.options.getBoolean('force')
		    	tagModule.onRun<ChatInputCommandInteraction>(interaction.client, interaction, ['deleteAll', `${forced}`])
		    	break;
		    }
	    }
	}
}