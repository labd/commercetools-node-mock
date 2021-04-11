import AbstractService from './abstract'
import { Router } from 'express'
import { StoreRepository } from '../repositories/store'
import { AbstractStorage } from '../storage'

export class StoreService extends AbstractService {
  public repository: StoreRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new StoreRepository(storage)
  }

  getBasePath() {
    return 'stores'
  }
}
