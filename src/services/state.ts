import { StateRepository } from '../repositories/state'
import AbstractService from './abstract'
import { Router } from 'express'

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
