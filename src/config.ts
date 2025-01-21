import type { AbstractStorage } from "./storage";

export type Config = {
	strict: boolean;
	storage: AbstractStorage;
};
