import AbstractService from './abstract'
import { Router } from 'express'
import { TypeRepository } from '../repositories/type'
import { AbstractStorage } from '../storage'

export class TypeService extends AbstractService {
  public repository: TypeRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new TypeRepository(storage)
  }

  getBasePath() {
    return 'types'
  }
}
