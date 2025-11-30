import type { Router } from "express";
import type { ChannelRepository } from "../repositories/channel.ts";
import AbstractService from "./abstract.ts";

export class ChannelService extends AbstractService {
	public repository: ChannelRepository;

	constructor(parent: Router, repository: ChannelRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "channels";
	}
}
