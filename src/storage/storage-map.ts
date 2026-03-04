import { cloneObject } from "../helpers.ts";

/**
 * A Map wrapper that deep-clones values on insertion and retrieval.
 *
 * This ensures that the stored data is fully isolated from external
 * mutations: callers cannot accidentally corrupt the store by modifying
 * an object after inserting it, and retrieved objects are independent
 * copies that can be freely mutated without affecting the store.
 */
export class StorageMap<K, V> {
	private _map: Map<K, V>;

	constructor() {
		this._map = new Map();
	}

	get size(): number {
		return this._map.size;
	}

	set(key: K, value: V): this {
		this._map.set(key, cloneObject(value));
		return this;
	}

	get(key: K): V | undefined {
		const value = this._map.get(key);
		if (value === undefined) {
			return undefined;
		}
		return cloneObject(value);
	}

	has(key: K): boolean {
		return this._map.has(key);
	}

	delete(key: K): boolean {
		return this._map.delete(key);
	}

	clear(): void {
		this._map.clear();
	}

	/**
	 * Returns cloned values. Each value is a deep copy.
	 */
	values(): IterableIterator<V> {
		const inner = this._map.values();

		return (function* () {
			for (const value of inner) {
				yield cloneObject(value);
			}
		})() as IterableIterator<V>;
	}

	/**
	 * Returns cloned entries. Each value is a deep copy, keys are returned as-is.
	 */
	entries(): IterableIterator<[K, V]> {
		const inner = this._map.entries();
		return (function* () {
			for (const [key, value] of inner) {
				yield [key, cloneObject(value)] as [K, V];
			}
		})() as IterableIterator<[K, V]>;
	}

	[Symbol.iterator](): IterableIterator<[K, V]> {
		return this.entries();
	}
}
