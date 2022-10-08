import AbstractService from './abstract'
import { Router } from 'express'
import { SubscriptionRepository } from '../repositories/subscription'

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
