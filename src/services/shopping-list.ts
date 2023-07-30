import { Router } from 'express'
import { ShoppingListRepository } from './../repositories/shopping-list.js'
import AbstractService from './abstract.js'

export class ShoppingListService extends AbstractService {
  public repository: ShoppingListRepository

  constructor(parent: Router, repository: ShoppingListRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'shopping-lists'
  }
}
