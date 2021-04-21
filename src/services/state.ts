import { StateRepository } from '../repositories/state'
import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'

export class StateService extends AbstractService {
  public repository: StateRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new StateRepository(storage)
  }

  getBasePath() {
    return 'states'
  }
}
