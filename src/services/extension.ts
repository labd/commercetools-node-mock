import type { Router } from "express";
import type { ExtensionRepository } from "../repositories/extension.ts";
import AbstractService from "./abstract.ts";

export class ExtensionServices extends AbstractService {
	public repository: ExtensionRepository;

	constructor(parent: Router, repository: ExtensionRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "extensions";
	}
}
