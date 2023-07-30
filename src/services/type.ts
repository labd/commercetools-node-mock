import { Router } from 'express'
import { TypeRepository } from '../repositories/type.js'
import AbstractService from './abstract.js'

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
