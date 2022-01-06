import AbstractService from './abstract'
import { Router } from 'express'
import { ChannelRepository } from '../repositories/channel'
import { AbstractStorage } from '../storage'

export class ChannelService extends AbstractService {
  public repository: ChannelRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new ChannelRepository(storage)
  }

  getBasePath() {
    return 'channels'
  }
}
