import type { Router } from "express";
import type { TypeRepository } from "../repositories/type/index.ts";
import AbstractService from "./abstract.ts";

export class TypeService extends AbstractService {
	public repository: TypeRepository;

	constructor(parent: Router, repository: TypeRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "types";
	}
}
