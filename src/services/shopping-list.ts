import { ShoppingListRepository } from './../repositories/shopping-list'
import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'

export class ShoppingListService extends AbstractService {
  public repository: ShoppingListRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ShoppingListRepository(storage)
  }

  getBasePath() {
    return 'shopping-lists'
  }
}
