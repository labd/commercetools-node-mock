import type {
    AttributeGroup,
    AttributeGroupChangeNameAction,
    AttributeGroupDraft,
    AttributeGroupSetAttributesAction, AttributeGroupSetDescriptionAction, AttributeGroupSetKeyAction
} from '@commercetools/platform-sdk'
import {AbstractResourceRepository, type RepositoryContext} from './abstract.js'
import {getBaseResourceProperties} from '../helpers.js';
import {Writable} from "../types.js";

export class AttributeGroupRepository extends AbstractResourceRepository<'attribute-group'> {
    getTypeId() {
        return 'attribute-group' as const
    }

    create(context: RepositoryContext, draft: AttributeGroupDraft): AttributeGroup {
        const resource: AttributeGroup = {
            ...getBaseResourceProperties(),
            name: draft.name,
            description: draft.description,
            key: draft.key,
            attributes: draft.attributes
        }
        this.saveNew(context, resource)
        return resource
    }

    actions = {
        setAttributes: (
            _context: RepositoryContext,
            resource: Writable<AttributeGroup>,
            {attributes}: AttributeGroupSetAttributesAction
        ) => {
            resource.attributes = attributes
        },
        changeName: (
            _context: RepositoryContext,
            resource: Writable<AttributeGroup>,
            {name}: AttributeGroupChangeNameAction
        ) => {
            resource.name = name
        },
        setDescription: (
            _context: RepositoryContext,
            resource: Writable<AttributeGroup>,
            {description}: AttributeGroupSetDescriptionAction
        ) => {
            resource.description = description
        },
        setKey: (
            _context: RepositoryContext,
            resource: Writable<AttributeGroup>,
            {key}: AttributeGroupSetKeyAction
        ) => {
            resource.key = key
        },
    }
}
