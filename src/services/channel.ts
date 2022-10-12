import { Router } from 'express'
import { ChannelRepository } from '../repositories/channel'
import AbstractService from './abstract'

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
