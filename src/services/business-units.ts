import { Router } from "express";
import { BusinessUnitRepository } from "../repositories/business-unit.js";
import AbstractService from "./abstract.js";

export class BusinessUnitServices extends AbstractService {
    public repository: BusinessUnitRepository

    constructor(parent: Router, repository: BusinessUnitRepository) {
        super(parent)

        this.repository = repository
    }

    protected getBasePath(): string {
        return 'business-units'
    }
}