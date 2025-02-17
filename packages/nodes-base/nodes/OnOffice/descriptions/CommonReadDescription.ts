import { INodeProperties } from 'n8n-workflow';

const commonReadDescription: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		placeholder: 'Add Filter on new field',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		description: 'Filter the results by fields.',
		options: [
			{
				name: 'filter',
				displayName: 'Filter',
				values: [
					{
						displayName: 'Field',
						name: 'field',
						type: 'string',
						default: '',
						description:
							'The field to filter by. The special fields listed above such as phone, email, defaultmail etc. cannot be queried by filter, but "Email" and "Telefon1" will work.',
					},
					{
						displayName: 'Filter operation',
						name: 'operations',
						placeholder: 'Add operation',
						type: 'fixedCollection',
						default: {},
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'operation',
								displayName: 'Filter operation',
								values: [
									{
										displayName: 'Operator',
										name: 'operator',
										type: 'options',
										options: [
											{
												name: 'is',
												value: 'is',
											},
											{
												name: 'or',
												value: 'or',
											},
											{
												name: '=',
												value: 'equal',
											},
											{
												name: '>',
												value: 'greater',
											},
											{
												name: '<',
												value: 'less',
											},
											{
												name: '>=',
												value: 'greaterequal',
											},
											{
												name: '<=',
												value: 'lessequal',
											},
											{
												name: '<>',
												value: 'notequal',
												description: 'Not equal',
											},
											{
												name: 'between',
												value: 'between',
											},
											{
												name: 'like',
												value: 'like',
											},
											{
												name: 'not like',
												value: 'notlike',
											},
											{
												name: 'in',
												value: 'in',
											},
											{
												name: 'not in',
												value: 'notin',
											},
										],
										default: 'equal',
										description: 'The SQL filter operator',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										displayOptions: {
											hide: {
												operator: ['between', 'in', 'notin'],
											},
										},
										default: '',
										description: 'The value which should be applied to the filtering',
									},
									{
										displayName: 'Values',
										name: 'values',
										type: 'string',
										typeOptions: {
											multipleValues: true,
										},
										displayOptions: {
											show: {
												operator: ['in', 'notin'],
											},
										},
										default: '',
										description: 'The values which should be applied to the filtering.',
									},
									{
										displayName: 'Start',
										name: 'start',
										type: 'string',
										displayOptions: {
											show: {
												operator: ['between'],
											},
										},
										default: '',
										description: 'The smallest value.',
									},
									{
										displayName: 'End',
										name: 'end',
										type: 'string',
										displayOptions: {
											show: {
												operator: ['between'],
											},
										},
										default: '',
										description: 'The biggest value',
									},
								],
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 500,
			numberPrecision: 0,
		},
		default: 20,
		description: 'Maximum number of records in the list',
	},
	{
		displayName: 'List offset',
		name: 'offset',
		type: 'number',
		typeOptions: {
			minValue: 0,
			numberPrecision: 0,
		},
		default: 0,
		description:
			'Offset of the list, that means from which data record onwards the list should be output',
	},
	{
		displayName: 'Sort by',
		name: 'sortBy',
		type: 'string',
		default: '',
		description: 'Field to sort by.',
	},
	{
		displayName: 'Order',
		name: 'order',
		type: 'options',
		options: [
			{
				name: 'Ascending',
				value: 'ASC',
			},
			{
				name: 'Descending',
				value: 'DESC',
			},
		],
		default: '',
		description: 'Sorting order',
	},
];

export const getCommonReadDescription = (omit: string[] = []): INodeProperties[] => {
	return commonReadDescription.filter((property: INodeProperties) => !omit.includes(property.name));
}
