import AbstractService from './abstract'
import { Router } from 'express'
import { ChannelRepository } from '../repositories/channel'

export class ChannelService extends AbstractService {
  public repository: ChannelRepository

  constructor(parent: Router, repository: ChannelRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'channels'
  }
}
