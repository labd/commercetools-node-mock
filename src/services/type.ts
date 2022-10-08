import AbstractService from './abstract'
import { Router } from 'express'
import { TypeRepository } from '../repositories/type'

export class TypeService extends AbstractService {
  public repository: TypeRepository

  constructor(parent: Router, repository: TypeRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'types'
  }
}
