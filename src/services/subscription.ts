import { Router } from 'express'
import { SubscriptionRepository } from '../repositories/subscription.js'
import AbstractService from './abstract.js'

export class SubscriptionService extends AbstractService {
  public repository: SubscriptionRepository

  constructor(parent: Router, repository: SubscriptionRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'subscriptions'
  }
}
