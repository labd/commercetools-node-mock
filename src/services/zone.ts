import { Router } from 'express'
import { ZoneRepository } from '../repositories/zone.js'
import AbstractService from './abstract.js'

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
