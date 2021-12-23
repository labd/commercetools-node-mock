import { Router } from 'express'
import AbstractService from './abstract'
import { AbstractStorage } from '../storage'
import { ZoneRepository } from '../repositories/zone'

export class ZoneService extends AbstractService {
  public repository: ZoneRepository

  createStatusCode = 200

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ZoneRepository(storage)
  }

  getBasePath() {
    return 'zones'
  }
}
