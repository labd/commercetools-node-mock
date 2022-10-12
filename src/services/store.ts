import { Router } from 'express'
import { StoreRepository } from '../repositories/store'
import AbstractService from './abstract'

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
