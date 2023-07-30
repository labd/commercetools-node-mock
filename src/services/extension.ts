import { Router } from 'express'
import { ExtensionRepository } from '../repositories/extension.js'
import AbstractService from './abstract.js'

export class ExtensionServices extends AbstractService {
  public repository: ExtensionRepository

  constructor(parent: Router, repository: ExtensionRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'extensions'
  }
}
