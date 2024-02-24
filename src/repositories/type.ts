import type {
	FieldDefinition,
	InvalidOperationError,
	Type,
	TypeAddEnumValueAction,
	TypeAddFieldDefinitionAction,
	TypeChangeEnumValueLabelAction,
	TypeChangeFieldDefinitionOrderAction,
	TypeChangeNameAction,
	TypeDraft,
	TypeRemoveFieldDefinitionAction,
	TypeSetDescriptionAction,
	TypeUpdateAction,
} from '@commercetools/platform-sdk'
import isEqual from 'lodash.isequal'
import { CommercetoolsError } from '../exceptions.js'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'

export class TypeRepository extends AbstractResourceRepository<'type'> {
	getTypeId() {
		return 'type' as const
	}

	create(context: RepositoryContext, draft: TypeDraft): Type {
		const resource: Type = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.name,
			resourceTypeIds: draft.resourceTypeIds,
			fieldDefinitions: draft.fieldDefinitions || [],
			description: draft.description,
		}
		return this.saveNew(context, resource)
	}
	actions: Partial<
		Record<
			TypeUpdateAction['action'],
			(
				context: RepositoryContext,
				resource: Writable<Type>,
				action: any
			) => void
		>
	> = {
		addFieldDefinition: (
			context: RepositoryContext,
			resource: Writable<Type>,
			{ fieldDefinition }: TypeAddFieldDefinitionAction
		) => {
			resource.fieldDefinitions.push(fieldDefinition)
		},
		removeFieldDefinition: (
			context: RepositoryContext,
			resource: Writable<Type>,
			{ fieldName }: TypeRemoveFieldDefinitionAction
		) => {
			resource.fieldDefinitions = resource.fieldDefinitions.filter(
				(f) => f.name !== fieldName
			)
		},
		setDescription: (
			context: RepositoryContext,
			resource: Writable<Type>,
			{ description }: TypeSetDescriptionAction
		) => {
			resource.description = description
		},
		changeName: (
			context: RepositoryContext,
			resource: Writable<Type>,
			{ name }: TypeChangeNameAction
		) => {
			resource.name = name
		},
		changeFieldDefinitionOrder: (
			context: RepositoryContext,
			resource: Writable<Type>,
			{ fieldNames }: TypeChangeFieldDefinitionOrderAction
		) => {
			const fields = new Map(
				resource.fieldDefinitions.map((item) => [item.name, item])
			)
			const result: FieldDefinition[] = []
			let current = resource.fieldDefinitions

			fieldNames.forEach((fieldName) => {
				const field = fields.get(fieldName)
				if (field === undefined) {
					throw new Error('New field')
				}
				result.push(field)

				// Remove from current items
				current = current.filter((f) => f.name !== fieldName)
			})

			if (
				isEqual(
					fieldNames,
					resource.fieldDefinitions.map((item) => item.name)
				)
			) {
				throw new CommercetoolsError<InvalidOperationError>({
					code: 'InvalidOperation',
					message: "'fieldDefinitions' has no changes.",
					action: {
						action: 'changeFieldDefinitionOrder',
						fieldNames: fieldNames,
					},
				})
			}

			resource.fieldDefinitions = result
			// Add fields which were not specified in the order as last items. Not
			// sure if this follows commercetools
			resource.fieldDefinitions.push(...current)
		},
		addEnumValue: (
			context: RepositoryContext,
			resource: Writable<Type>,
			{ fieldName, value }: TypeAddEnumValueAction
		) => {
			resource.fieldDefinitions.forEach((field) => {
				if (field.name === fieldName) {
					// TODO, should be done better i suppose
					if (field.type.name === 'Enum') {
						field.type.values.push(value)
					} else if (
						field.type.name === 'Set' &&
						field.type.elementType.name === 'Enum'
					) {
						field.type.elementType.values.push(value)
					} else {
						throw new Error('Type is not a Enum (or Set of Enum)')
					}
				}
			})
		},
		changeEnumValueLabel: (
			context: RepositoryContext,
			resource: Writable<Type>,
			{ fieldName, value }: TypeChangeEnumValueLabelAction
		) => {
			resource.fieldDefinitions.forEach((field) => {
				if (field.name === fieldName) {
					// TODO, should be done better i suppose
					if (field.type.name === 'Enum') {
						field.type.values.forEach((v) => {
							if (v.key === value.key) {
								v.label = value.label
							}
						})
					} else if (
						field.type.name === 'Set' &&
						field.type.elementType.name === 'Enum'
					) {
						field.type.elementType.values.forEach((v) => {
							if (v.key === value.key) {
								v.label = value.label
							}
						})
					} else {
						throw new Error('Type is not a Enum (or Set of Enum)')
					}
				}
			})
		},
	}
}
