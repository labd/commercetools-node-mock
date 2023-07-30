import { Router } from 'express'
import { StoreRepository } from '../repositories/store.js'
import AbstractService from './abstract.js'

export class StoreService extends AbstractService {
  public repository: StoreRepository

  constructor(parent: Router, repository: StoreRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'stores'
  }
}
