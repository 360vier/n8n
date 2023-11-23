import { INodeProperties } from 'n8n-workflow';
import {
	generateReadAdditionalFieldsDescription,
	generateReadDataFieldsDescription,
} from './descriptionHelpers';

export const userOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Read',
				value: 'read',
				description: 'Read a user',
			},
		],
		default: 'read',
		description: 'The operation to perform.',
	},
];

export const userFields: INodeProperties[] = [
	...generateReadDataFieldsDescription(
		{ resource: 'user', loadOptionsMethod: 'getUserProperties' }
	),
	...generateReadAdditionalFieldsDescription(
		{resource: 'user'}
	),
]
