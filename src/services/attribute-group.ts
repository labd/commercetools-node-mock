import {Router} from 'express'
import AbstractService from './abstract.js'
import {AttributeGroupRepository} from "../repositories/attribute-group.js";

export class AttributeGroupService extends AbstractService {
    public repository: AttributeGroupRepository

    constructor(parent: Router, repository: AttributeGroupRepository) {
        super(parent)
        this.repository = repository
    }

    getBasePath() {
        return 'attribute-groups'
    }
}
