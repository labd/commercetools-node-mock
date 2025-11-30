import type { AbstractStorage } from "./storage/index.ts";

export type Config = {
	strict: boolean;
	storage: AbstractStorage;
};
