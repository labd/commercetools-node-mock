import { Router } from 'express'
import { InventoryEntryRepository } from '../repositories/inventory-entry.js'
import AbstractService from './abstract.js'

export class InventoryEntryService extends AbstractService {
  public repository: InventoryEntryRepository

  constructor(parent: Router, repository: InventoryEntryRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'inventory'
  }
}
