import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'
import { ExtensionRepository } from '../repositories/extension'

export class ExtensionServices extends AbstractService {
  public repository: ExtensionRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ExtensionRepository(storage)
  }

  getBasePath() {
    return 'extensions'
  }
}
