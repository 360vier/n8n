import { INodeProperties } from 'n8n-workflow';
import {
	generateReadAdditionalFieldsDescription,
	generateReadDataFieldsDescription,
} from './descriptionHelpers';

export const estateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['estate'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create an estate',
			},
			{
				name: 'Read',
				value: 'read',
				description: 'Read an estate',
			},
			{
				name: 'Edit',
				value: 'edit',
				description: 'Edit an estate',
			},
		],
		default: 'read',
		description: 'The operation to perform.',
	},
];

export const estateFields: INodeProperties[] = [
	...generateReadDataFieldsDescription({
		resource: 'estate',
		specialFields: [
			{
				name: 'verkauft',
				value: 'verkauft',
				description:
					'Include a "verkauft" field in the response. 1 indicates that the estate is sold or rented.',
			},
			{
				name: 'reserviert',
				value: 'reserviert',
				description:
					'Include a "reserviert" field in the response. 1 indicates that the estate is reserved.',
			},
			{
				name: 'multiParkingLot',
				value: 'multiParkingLot',
				description:
					'Include a "multiParkingLot" field in the response. Look into documentation for more information.',
			},
		],
	}),
	...generateReadAdditionalFieldsDescription({
		resource: 'estate',
		additionalFields: [
			{
				displayName: 'Filter ID',
				name: 'filterId',
				type: 'number',
				typeOptions: {
					minValue: 0,
					numberPrecision: 0,
				},
				default: 0,
				description: 'Restrict the selection of estate data records by an existing filter',
			},
			{
				//TODO: Figure out what this does
				displayName: 'Format output',
				name: 'formatOutput',
				type: 'boolean',
				default: false,
				description: 'Enable formatted output',
			},
			{
				//TODO: Figure out what this does
				displayName: 'Estate language',
				name: 'estateLanguage',
				type: 'string',
				default: '',
				placeholder: 'DEU',
				description: 'Language of the object, only relevant for multi-language estates',
			},
			{
				//TODO: Figure out what this does
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: '',
				description: 'Output language',
			},
			{
				displayName: 'Add estate language',
				name: 'addEstateLanguage',
				type: 'boolean',
				default: false,
				description:
					'Add the language of the estate as "language" to the output. If the estate in the default language, the field will be set to an empty string.',
			},
			{
				displayName: 'Add main language ID',
				name: 'addMainLangId',
				type: 'boolean',
				default: false,
				description: 'Adds the estate ID of the estate in the main language to the response?',
			},
			{
				displayName: 'Geo Search',
				name: 'geoRangeSearch',
				type: 'collection',
				default: { country: 'DEU', radius: 10, zip: 52068 },
				options: [
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: 'DEU',
						description: 'Country to search in',
					},
					{
						displayName: 'Radius',
						name: 'radius',
						type: 'number',
						default: 10,
						description: 'Search radius in km',
					},
					{
						displayName: 'Zipcode',
						name: 'zip',
						type: 'number',
						default: 52068,
						description: 'The zipcode for the center of the search',
					},
				],
				description: 'Radius search around zipcode.',
			},
		],
	}),
];
