import { Router } from 'express'
import { StateRepository } from '../repositories/state.js'
import AbstractService from './abstract.js'

export class StateService extends AbstractService {
	public repository: StateRepository

	constructor(parent: Router, repository: StateRepository) {
		super(parent)
		this.repository = repository
	}

	getBasePath() {
		return 'states'
	}
}
