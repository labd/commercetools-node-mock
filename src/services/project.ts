import { Router } from 'express'
import { Request, Response } from 'express'
import { AbstractStorage } from '../storage'
import { ProjectRepository } from '../repositories/project'
import { Update } from '@commercetools/platform-sdk'

export class ProjectService {
  public repository: ProjectRepository

  constructor(parent: Router, storage: AbstractStorage) {
    this.repository = new ProjectRepository(storage)
    this.registerRoutes(parent)
  }

  registerRoutes(parent: Router) {
    parent.get('', this.get.bind(this))
    parent.post('', this.post.bind(this))
  }

  get(request: Request, response: Response) {
    const projectKey = request.params.projectKey
    const project = this.repository.get(projectKey)
    return response.status(200).send(project)
  }

  post(request: Request, response: Response) {
    const updateRequest: Update = request.body
    const project = this.repository.get(request.params.projectKey)

    if (!project) {
        return response.status(404).send({})
    }

    const updatedResource = this.repository.processUpdateActions(
      request.params.projectKey,
      project,
      updateRequest.actions
    )

    return response.status(200).send({})
  }
}
