import { expect, test } from 'bun:test'
import { Location, haversineDistance } from './haversine.js'

test('haversine', () => {
	// Lab Digital
	const src: Location = {
		latitude: 5.110230209615395,
		longitude: 52.06969591642097,
	}

	// Dom Tower
	const dst: Location = {
		latitude: 5.121310867198959,
		longitude: 52.09068804569714,
	}

	const dist = haversineDistance(src, dst)
	expect(dist).toBeGreaterThan(2631)
	expect(dist).toBeLessThan(2632)
})
