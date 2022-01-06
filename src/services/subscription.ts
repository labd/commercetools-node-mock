import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'
import { SubscriptionRepository } from '../repositories/subscription'

export class SubscriptionService extends AbstractService {
  public repository: SubscriptionRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new SubscriptionRepository(storage)
  }

  getBasePath() {
    return 'subscriptions'
  }
}
