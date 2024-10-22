import { expect, test } from "vitest";
import type { Location } from "./haversine";
import { haversineDistance } from "./haversine";

test("haversine", () => {
	// Lab Digital
	const src: Location = {
		latitude: 5.110230209615395,
		longitude: 52.06969591642097,
	};

	// Dom Tower
	const dst: Location = {
		latitude: 5.121310867198959,
		longitude: 52.09068804569714,
	};

	const dist = haversineDistance(src, dst);
	expect(dist).toBeGreaterThan(2631);
	expect(dist).toBeLessThan(2632);
});
