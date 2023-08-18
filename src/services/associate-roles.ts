import { Router } from "express";
import { AbstractResourceRepository } from "../repositories/abstract";
import { AssociateRoleRepository } from "../repositories/associate-role";
import AbstractService from "./abstract";

export class AssociateRoleServices extends AbstractService {
    public repository: AssociateRoleRepository

    constructor(parent: Router, repository: AssociateRoleRepository) {
        super(parent)

        this.repository = repository
    }

    protected getBasePath(): string {
        return 'associate-roles'
    }
}