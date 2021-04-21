import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'
import { InventoryEntryRepository } from '../repositories/inventory-entry'

export class InventoryEntryService extends AbstractService {
  public repository: InventoryEntryRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new InventoryEntryRepository(storage)
  }

  getBasePath() {
    return 'inventory'
  }
}
