import type { CommercetoolsMockOptions } from "./ctMock.ts";
import { CommercetoolsMock } from "./ctMock.ts";
import { getBaseResourceProperties } from "./helpers.ts";
import { AbstractStorage, InMemoryStorage } from "./storage/index.ts";

export type { FastifyBaseLogger } from "fastify";

export {
	AbstractStorage,
	CommercetoolsMock,
	InMemoryStorage,
	getBaseResourceProperties,
	type CommercetoolsMockOptions,
};
