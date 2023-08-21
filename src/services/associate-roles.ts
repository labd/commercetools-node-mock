import { Router } from 'express'
import { AssociateRoleRepository } from '../repositories/associate-role.js'
import AbstractService from './abstract.js'

export class AssociateRoleServices extends AbstractService {
	public repository: AssociateRoleRepository

	constructor(parent: Router, repository: AssociateRoleRepository) {
		super(parent)

		this.repository = repository
	}

	protected getBasePath(): string {
		return 'associate-roles'
	}
}
