import { ShoppingListRepository } from './../repositories/shopping-list'
import AbstractService from './abstract'
import { Router } from 'express'

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
