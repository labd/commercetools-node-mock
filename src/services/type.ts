import { Router } from "express";
import { TypeRepository } from "../repositories/type";
import AbstractService from "./abstract";

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
