import { Router } from 'express'
import AbstractService from './abstract'
import { ZoneRepository } from '../repositories/zone'

export class ZoneService extends AbstractService {
  public repository: ZoneRepository

  constructor(parent: Router, repository: ZoneRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'zones'
  }
}
