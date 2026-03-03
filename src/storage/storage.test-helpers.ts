import type {
	Category,
	Channel,
	Customer,
	Type,
} from "@commercetools/platform-sdk";
import type { Writable } from "#src/types.ts";
import type { AbstractStorage } from "./abstract.ts";
import { InMemoryStorage } from "./in-memory.ts";
import { SQLiteStorage } from "./sqlite.ts";

export const makeCategory = (
	overrides: Partial<Writable<Category>> = {},
): Category =>
	({
		id: "cat-1",
		version: 1,
		createdAt: "2024-01-01T00:00:00.000Z",
		lastModifiedAt: "2024-01-01T00:00:00.000Z",
		name: { en: "Test Category" },
		slug: { en: "test-category" },
		orderHint: "0.1",
		ancestors: [],
		...overrides,
	}) as Category;

export const makeChannel = (
	overrides: Partial<Writable<Channel>> = {},
): Channel =>
	({
		id: "channel-1",
		version: 1,
		key: "default-channel",
		createdAt: "2024-01-01T00:00:00.000Z",
		lastModifiedAt: "2024-01-01T00:00:00.000Z",
		roles: [],
		...overrides,
	}) as Channel;

export const makeCustomer = (
	overrides: Partial<Writable<Customer>> = {},
): Customer =>
	({
		id: "customer-1",
		version: 1,
		createdAt: "2024-01-01T00:00:00.000Z",
		lastModifiedAt: "2024-01-01T00:00:00.000Z",
		email: "test@example.com",
		addresses: [],
		isEmailVerified: false,
		authenticationMode: "Password",
		stores: [],
		...overrides,
	}) as Customer;

export const makeType = (overrides: Partial<Writable<Type>> = {}): Type =>
	({
		id: "type-1",
		version: 1,
		createdAt: "2024-01-01T00:00:00.000Z",
		lastModifiedAt: "2024-01-01T00:00:00.000Z",
		key: "my-type",
		name: { en: "My Type" },
		resourceTypeIds: ["category"],
		fieldDefinitions: [],
		...overrides,
	}) as Type;

export const storageEngineName = process.env.STORAGE_ENGINE || "in-memory";

export function createStorage(): AbstractStorage {
	switch (storageEngineName) {
		case "in-memory":
			return new InMemoryStorage();
		case "sqlite":
			return new SQLiteStorage({ filename: ":memory:" });
		default:
			throw new Error(`Unknown STORAGE_ENGINE: ${storageEngineName}`);
	}
}
