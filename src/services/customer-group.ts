import { Router } from 'express'
import { CustomerGroupRepository } from '../repositories/customer-group.js'
import AbstractService from './abstract.js'

export class CustomerGroupService extends AbstractService {
	public repository: CustomerGroupRepository

	constructor(parent: Router, repository: CustomerGroupRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'customer-groups'
	}
}
