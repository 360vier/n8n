import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { addressFields, addressOperations } from './descriptions/AddressDescription';
import { OnOfficeFieldConfiguration, OnOfficeReadAdditionalFields } from './interfaces';
import { estateFields, estateOperations } from './descriptions/EstateDescription';
import { userOperations, userFields } from './descriptions/UserDescription';
import {
	fieldConfigurationFields,
	fieldConfigurationOperations,
} from './descriptions/FieldConfigurationDescription';
import {
	convertMultiselectFieldsToArray,
	createFilterParameter,
	mkGetProperties,
	OnOfficeRequestBatch,
} from './GenericFunctions';
import {
	searchCriteriaFields,
	searchCriteriaOperations,
} from './descriptions/SearchCriteriaDescription';
import { relationFields, relationOperations } from './descriptions/RelationDescription';
import {
	actionKindTypeFields,
	actionKindTypeOperations,
} from './descriptions/ActionKindTypeDescription';

export class OnOffice implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OnOffice',
		name: 'onOffice',
		icon: 'file:onoffice.svg',
		group: ['transform'],
		version: 1,
		description: 'Consume OnOffice API',
		documentationUrl: 'https://apidoc.onoffice.de/',
		defaults: {
			name: 'OnOffice',
			color: '#80a9d7',
		},
		inputs: ['main'],
		outputs: ['main'],
		subtitle: '={{$parameter["operation"] + " " + $parameter["resource"]}}',
		credentials: [
			{
				name: 'onOfficeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Estate',
						value: 'estate',
					},
					{
						name: 'Address',
						value: 'address',
					},
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Field Configuration',
						value: 'fields',
					},
					{
						name: 'Search Criteria',
						value: 'searchcriteria',
					},
					{
						name: 'Relation',
						value: 'relation',
					},
					{
						name: 'Action kind and type',
						value: 'actionkindtype',
					},
				],
				default: 'address',
				required: true,
				description: 'Resource to consume',
			},

			...addressOperations,
			...addressFields,

			...estateOperations,
			...estateFields,

			...userOperations,
			...userFields,

			...fieldConfigurationOperations,
			...fieldConfigurationFields,

			...searchCriteriaOperations,
			...searchCriteriaFields,

			...relationOperations,
			...relationFields,

			...actionKindTypeOperations,
			...actionKindTypeFields,
		],
	};

	methods = {
		loadOptions: {
			getAddressProperties: mkGetProperties('address'),
      getUserProperties: mkGetProperties('user'),
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const continueOnFail = this.continueOnFail();

		const batch = new OnOfficeRequestBatch(this, continueOnFail ? items.length : 1);

		const results = items.map(async (item, i) => {
			const returnData = [];
			switch (resource) {
				case 'relation':
					{
						const relationtype = `urn:onoffice-de-ns:smart:2.5:relationTypes:${this.getNodeParameter(
							'parentType',
							i,
							null,
						)}:${this.getNodeParameter('childType', i, null)}${this.getNodeParameter('relation', i, null)
							? ':' + this.getNodeParameter('relation', i, null)
							: ''
							}`;

						if (operation === 'create' || operation === 'update') {
							const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

							const tempRelationinfo: Record<string, unknown> = {};
							if (additionalFields.relationInfo) {
								const customRelationInfo = (additionalFields.relationInfo as IDataObject)
									.customRelationInfo as IDataObject[];

								if (customRelationInfo) {
									for (const customProperty of customRelationInfo) {
										tempRelationinfo[customProperty.key as string] = customProperty.value;
									}
								}
							}
							const relationinfo = Object.keys(tempRelationinfo).length
								? tempRelationinfo
								: undefined;

							const parentIds = this.getNodeParameter('parentids', i, null) || [
								this.getNodeParameter('parentid', i, null),
							];
							const childIds = this.getNodeParameter('childids', i, null) || [
								this.getNodeParameter('childid', i, null),
							];

							const onOfficeAction = operation === 'update' ? 'modify' : operation;

							const result = await batch.request(
								onOfficeAction,
								resource,
								{
									relationtype,
									parentid: parentIds,
									childid: childIds,
									relationinfo,
								},
								'relation',
							);

							returnData.push(result.length ? result : [{ success: true }]);
						}

						if (operation === 'delete') {
							const result = await batch.request(
								operation,
								resource,
								{
									relationtype,
									parentid: this.getNodeParameter('parentid', i, null),
									childid: this.getNodeParameter('childid', i, null),
								},
								'relation',
							);

							returnData.push(result.length ? result : [{ success: true }]);
						}
						if (operation === 'read') {
							const queryByChildId = this.getNodeParameter('queryByChildId', i, false) as boolean;

							const result = await batch.request(
								'get',
								'idsfromrelation',
								{
									relationtype,
									parentids: this.getNodeParameter('parentids', i, null),
									childids: this.getNodeParameter('childids', i, null),
								},
							);

							// Process result for better usability
							const processedResult = result.flatMap(({ id, elements }) =>
								Object.entries(elements).flatMap(([key, values]) =>
									Array.isArray(values)
										? values.map((value) => ({
											module: id,
											parentId: queryByChildId ? value : key,
											childId: queryByChildId ? key : value,
										}))
										: [],
								),
							);

							returnData.push(processedResult);
						}
					}
					break;
				case 'estate':
					{
						if (operation === 'read') {
							const dataFields = [
								...(this.getNodeParameter('data', i) as string[]),
								...(this.getNodeParameter('specialData', i) as string[]),
							];

							const additionalFields = this.getNodeParameter(
								'additionalFields',
								i,
							) as OnOfficeReadAdditionalFields;

							const parameters = {
								data: dataFields,
								recordids: additionalFields.recordIds,
								filterid: additionalFields.filterId,
								filter: createFilterParameter(additionalFields.filters),
								listlimit: additionalFields.limit,
								listoffset: additionalFields.offset,
								sortby: additionalFields.sortBy,
								sortorder: additionalFields.order,
								formatoutput: additionalFields.formatOutput,
								outputlanguage: additionalFields.language,
								countryIsoCodeType: additionalFields.countryIsoCodeType || undefined,
								estatelanguage: additionalFields.estateLanguage,
								addestatelanguage: additionalFields.addEstateLanguage,
								addMainLangId: additionalFields.addMainLangId,
								georangesearch: additionalFields.geoRangeSearch,
							};

							const result = await batch.request<Record<string, unknown>>(
								'read',
								resource,
								parameters,
							);

							returnData.push(result.map((r) => convertMultiselectFieldsToArray(r)));
						}
						if (operation === 'update') {
							const resourceId = this.getNodeParameter('resourceId', i) as string;

							const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

							const properties: Record<string, unknown> = {};
							if (additionalFields.customPropertiesUi) {
								const customProperties = (additionalFields.customPropertiesUi as IDataObject)
									.customPropertiesValues as IDataObject[];

								if (customProperties) {
									for (const customProperty of customProperties) {
										properties[customProperty.property as string] = customProperty.value;
									}
								}
							}

							const parameters = properties;

							const result = await batch.request(
								'modify',
								resource,
								parameters,
								resourceId,
							);

							returnData.push(result);
						}
					}
					break;
				case 'address':
					{
						if (operation === 'create') {
							const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

							const properties: Record<string, unknown> = {};
							if (additionalFields.customPropertiesUi) {
								const customProperties = (additionalFields.customPropertiesUi as IDataObject)
									.customPropertiesValues as IDataObject[];

								if (customProperties) {
									for (const customProperty of customProperties) {
										properties[customProperty.property as string] = customProperty.value;
									}
								}
							}

							const parameters = {
								phone: additionalFields.phone ?? undefined,
								phone_private: additionalFields.phonePrivate,
								phone_business: additionalFields.phoneBusiness,
								mobile: additionalFields.mobile,
								default_phone: additionalFields.defaultPhone,
								fax: additionalFields.fax,
								fax_private: additionalFields.faxPrivate,
								fax_business: additionalFields.faxBusiness,
								default_fax: additionalFields.defaultFax,
								email: additionalFields.email,
								email_business: additionalFields.emailBusiness,
								email_private: additionalFields.emailPrivate,
								default_email: additionalFields.defaultEmail,
								Status: additionalFields.status,
								...properties,
								checkDuplicate: additionalFields.checkDuplicate,
								noOverrideByDuplicate: additionalFields.noOverrideByDuplicate,
							};

							const result = await batch.request(
								'create',
								resource,
								parameters,
							);

							returnData.push(result);
						}
						if (operation === 'read') {
							const dataFields = [
								...(this.getNodeParameter('data', i) as string[]),
								...(this.getNodeParameter('specialData', i) as string[]),
							];

							const additionalFields = this.getNodeParameter(
								'additionalFields',
								i,
							) as OnOfficeReadAdditionalFields;

							const parameters = {
								data: dataFields,
								recordids: additionalFields.recordIds,
								filterid: additionalFields.filterId,
								filter: createFilterParameter(additionalFields.filters),
								listlimit: additionalFields.limit,
								listoffset: additionalFields.offset,
								sortby: additionalFields.sortBy,
								sortorder: additionalFields.order,
								formatoutput: additionalFields.formatOutput,
								outputlanguage: additionalFields.language,
								countryIsoCodeType: additionalFields.countryIsoCodeType || undefined,
								estatelanguage: additionalFields.estateLanguage,
								addestatelanguage: additionalFields.addEstateLanguage,
								addMainLangId: additionalFields.addMainLangId,
								georangesearch: additionalFields.geoRangeSearch,
							};

							const result = await batch.request<Record<string, unknown>>(
								'read',
								resource,
								parameters,
							);

							returnData.push(result.map((r) => convertMultiselectFieldsToArray(r)));
						}
						if (operation === 'update') {
							const resourceId = this.getNodeParameter('resourceId', i) as string;

							const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

							const properties: Record<string, unknown> = {};
							if (additionalFields.customPropertiesUi) {
								const customProperties = (additionalFields.customPropertiesUi as IDataObject)
									.customPropertiesValues as IDataObject[];

								if (customProperties) {
									for (const customProperty of customProperties) {
										properties[customProperty.property as string] = customProperty.value;
									}
								}
							}

							const parameters = { ...properties };

							const result = await batch.request(
								'modify',
								resource,
								parameters,
								resourceId,
							);

							returnData.push(result);
						}
					}
					break;
				case 'user':
					{
						if(operation === 'read') {
							const dataFields = [
								...(this.getNodeParameter('data', i) as string[]),
							];

							const additionalFields = this.getNodeParameter(
								'additionalFields',
								i,
							) as OnOfficeReadAdditionalFields;

							const parameters = {
								data: dataFields,
								filter: createFilterParameter(additionalFields.filters),
								listlimit: additionalFields.limit,
								sortby: additionalFields.sortBy,
							};

							const result = await batch.request<Record<string, unknown>>(
								'read',
								resource,
								parameters,
							);

							returnData.push(result.map((r) => convertMultiselectFieldsToArray(r)));
						}
					}
					break;
				case 'fields':
					{
						if (operation === 'read') {
							const additionalFields = this.getNodeParameter(
								'additionalFields',
								i,
								{},
							) as IDataObject;

							const parameters = {
								modules: this.getNodeParameter('modules', i, null) as string[] | undefined,
								labels: additionalFields.labels,
								language: additionalFields.language,
								fieldList: additionalFields.fieldList,
								showOnlyInactive: additionalFields.showOnlyInactive,
								realDataTypes: additionalFields.realDataTypes,
								showFieldMeasureFormat: additionalFields.showFieldMeasureFormat,
							};

							const result = await batch.request<OnOfficeFieldConfiguration<boolean>>(
								'get',
								'fields',
								parameters,
							);

							// Process result for better usability
							const processedResult = result.flatMap(({ id, elements }) =>
								Object.entries(elements)
									.flatMap(([key, value]) =>
										typeof value !== 'string' ? [[key, value] as const] : [],
									)
									.map(([key, { type, length, permittedvalues, compoundFields, label }]) => ({
										module: id,
										field: key,
										type,
										length,
										...(permittedvalues
											? {
												permittedvalues: Array.isArray(permittedvalues)
													? permittedvalues.map((value) => ({ value }))
													: Object.entries(permittedvalues).map(([value, label]) => ({
														value,
														label,
													})),
											}
											: {}),
										compoundFields,

										label,
									})),
							);

							returnData.push(processedResult);
						}
					}
					break;
				case 'searchcriteria':
					{
						if (operation === 'read') {
							const parameters = {
								ids: this.getNodeParameter('ids', i, null) as string[] | undefined,
								mode: this.getNodeParameter('mode', i, null) as string | undefined,
							};

							const result = await batch.request(
								'get',
								'searchcriterias',
								parameters,
							);

							returnData.push(result);
						}
						if (operation === 'listFields') {
							const result = await batch.request(
								'get',
								'searchCriteriaFields',
								{},
							);

							returnData.push(result);
						}
					}
					break;
				case 'actionkindtype':
					{
						if (operation === 'read') {
							const parameters = {
								lang: this.getNodeParameter('language', i, null),
							};

							const result = await batch.request(
								'get',
								'actionkindtypes',
								parameters,
							);

							returnData.push(result);
						}
					}
					break;
				default:
			}
			return returnData;
		});

		let returnData = [];
		if (continueOnFail) {
			// @ts-ignore
			returnData = (await Promise.allSettled(results)).map(outcome => outcome.status === 'rejected' ? [{ error: outcome.reason }] : outcome.value).flat();
		} else {
			returnData = (await Promise.all(results)).flat();
		}

		const result = returnData.flat() as unknown as IDataObject[];

		// Map data to n8n data structure
		return [this.helpers.returnJsonArray(result)];
	}
}
