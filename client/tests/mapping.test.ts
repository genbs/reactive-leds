import { describe, expect, test } from "@jest/globals"
import { mapPixels } from "../src/mapping" // Assuming mapPixels is here

const RED = [255, 0, 0]
const GREEN = [0, 255, 0]
const BLUE = [0, 0, 255]
const WHITE = [255, 255, 255]
const BLACK = [0, 0, 0]
const REDA = [...RED, 255]
const GREENA = [...GREEN, 255]
const BLUEA = [...BLUE, 255]
const WHITEA = [...WHITE, 255]
const BLACKA = [...BLACK, 255]

describe("mapping module", () => {
	test("simple mapping", () => {
		// Source: 4x1 image (Black, Red, Green, Blue)
		/**
		 * Source Pixels (4x1):
		 * +---+---+---+---+
		 * | B | R | G |Bl |
		 * +---+---+---+---+
		 */
		const sourcePixels = new Uint8Array([
			...BLACKA, // black (B)
			...REDA, // red   (R)
			...GREENA, // green (G)
			...BLUEA, // blue  (Bl)
		])
		const sourceSize: [number, number] = [4, 1]
		const grid: [number, number] = [4, 1]

		// Polygon covering the whole 4x1 grid
		/**
		 * Polygon Area on Grid (4x1):
		 * +---+---+---+---+
		 * | X | X | X | X |  (X = covered)
		 * +---+---+---+---+
		 * Polygon Coords: [0, 0, 4, 0, 4, 1, 0, 1]
		 */
		const polygon = [0, 0, 4, 0, 4, 1, 0, 1] as [number, number, number, number, number, number, number, number]
		const steps = 4 // 4 LEDs
		const w = 0 // White channel value

		const output = new Uint8Array(steps * 5)
		/**
		 * Expected LED Output (4 LEDs):
		 * LED:  0   1   2   3
		 * Col:  B   R   G   Bl
		 */
		const expected = new Uint8Array(
			[
				[0, 0, 0, 0, w], // LED 0 -> black
				[1, ...RED, w], // LED 1 -> red
				[2, ...GREEN, w], // LED 2 -> green
				[3, ...BLUE, w], // LED 3 -> blue
			].flat()
		)

		const result = mapPixels(sourcePixels, sourceSize, grid, polygon, steps, w, output)

		expect(result.length).toBe(expected.length)
		expect(result).toEqual(expected)
	})

	test("mapping first row with 8 steps", () => {
		/**
		 * Source Pixels (8x8):
		 * +---+---+---+---+---+---+---+---+
		 * | R | G |Bl | Y | M | C |Gr | W | Row 0
		 * +---+---+---+---+---+---+---+---+
		 * | B | B | B | B | B | B | B | B | Row 1
		 * +---+---+---+---+---+---+---+---+
		 * | B | B | B | B | B | B | B | B | Row 2
		 * +---+---+---+---+---+---+---+---+
		 * :   :   :   :   :   :   :   :   :
		 * +---+---+---+---+---+---+---+---+
		 * | B | B | B | B | B | B | B | B | Row 7
		 * +---+---+---+---+---+---+---+---+
		 * (R=Red, G=Green, Bl=Blue, Y=Yellow, M=Magenta, C=Cyan, Gr=Gray, W=White, B=Black)
		 */
		const sourcePixels = new Uint8Array(
			[
				// First row (8 pixels)
				REDA, // red
				GREENA, // green
				BLUEA, // blue
				[255, 255, 0, 255], // yellow
				[255, 0, 255, 255], // magenta
				[0, 255, 255, 255], // cyan
				[128, 128, 128, 255], // gray
				WHITEA, // white
				// Other 7 rows are black
				...Array(7 * 8)
					.fill(BLACKA)
					.flat(),
			].flat()
		)
		const sourceSize: [number, number] = [8, 8]
		const grid: [number, number] = [8, 8]

		/**
		 * Polygon Area on Grid (8x8): Covers first row
		 * +---+---+---+---+---+---+---+---+
		 * | X | X | X | X | X | X | X | X | y=0..1 (X = covered)
		 * +---+---+---+---+---+---+---+---+
		 * |   |   |   |   |   |   |   |   | y=1..2
		 * +---+---+---+---+---+---+---+---+
		 * :   :   :   :   :   :   :   :   :
		 * +---+---+---+---+---+---+---+---+
		 * |   |   |   |   |   |   |   |   | y=7..8
		 * +---+---+---+---+---+---+---+---+
		 * Polygon Coords: [0, 0, 8, 0, 8, 1, 0, 1]
		 */
		const polygon = [0, 0, 8, 0, 8, 1, 0, 1] as [number, number, number, number, number, number, number, number]
		const steps = 8
		const w = 0

		const output = new Uint8Array(steps * 5)
		/**
		 * Expected LED Output (8 LEDs): Maps the first source row
		 * LED:  0   1   2   3   4   5   6   7
		 * Col:  R   G   Bl  Y   M   C   Gr  W
		 */
		const expected = new Uint8Array(
			[
				[0, ...RED, w], // red
				[1, ...GREEN, w], // green
				[2, ...BLUE, w], // blue
				[3, 255, 255, 0, w], // yellow
				[4, 255, 0, 255, w], // magenta
				[5, 0, 255, 255, w], // cyan
				[6, 128, 128, 128, w], // gray
				[7, ...WHITE, w], // white
			].flat()
		)

		const result = mapPixels(sourcePixels, sourceSize, grid, polygon, steps, w, output)

		expect(result.length).toBe(expected.length)
		expect(result).toEqual(expected)
	})

	test("simple horizontal mapping", () => {
		// Source: 4x4 image
		/**
		 * Source Pixels (4x4):
		 * +---+---+---+---+
		 * | R | B | B | B |
		 * | R | B | B | B |
		 * | R | B | B | B |
		 * | R | B | B | B |
		 * +---+---+---+---+
		 */
		const sourcePixels = new Uint8Array([
			...REDA,
			...BLACKA,
			...BLACKA,
			...BLACKA,
			...REDA,
			...BLACKA,
			...BLACKA,
			...BLACKA,
			...REDA,
			...BLACKA,
			...BLACKA,
			...BLACKA,
			...REDA,
			...BLACKA,
			...BLACKA,
			...BLACKA,
		])
		const sourceSize: [number, number] = [4, 4]
		const grid: [number, number] = [4, 4]

		// Polygon covering the whole 4x4 grid
		/**
		 * Polygon Area on Grid (1x4):
		 * +---+---+---+---+
		 * | X |   |   |   |
		 * | X |   |   |   |
		 * | X |   |   |   |
		 * | X |   |   |   |
		 * +---+---+---+---+
		 * Polygon Coords: [0, 0, 1, 0, 1, 4, 0, 4]
		 */
		const polygon = [0, 0, 1, 0, 1, 4, 0, 4] as [number, number, number, number, number, number, number, number]
		const steps = 4
		const w = 0
		const output = new Uint8Array(steps * 5)
		/**
		 * Expected LED Output (4 LEDs):
		 * LED:  0   1   2   3
		 * Col:  R   R   R   R
		 */
		const expected = new Uint8Array(
			[
				[0, ...RED, w], // LED 0 -> red
				[1, ...RED, w], // LED 1 -> red
				[2, ...RED, w], // LED 2 -> red
				[3, ...RED, w], // LED 3 -> red
			].flat()
		)
		const result = mapPixels(sourcePixels, sourceSize, grid, polygon, steps, w, output)
		expect(result.length).toBe(expected.length)
		expect(result).toEqual(expected)
	})

	test("simple horizontal mapping", () => {
		// Source: 4x4 image
		/**
		 * Source Pixels (4x4):
		 * +---+---+---+---+
		 * | R | B | B | B |
		 * | R | B | B | B |
		 * | R | B | B | B |
		 * | R | B | B | B |
		 * +---+---+---+---+
		 */
		const sourcePixels = new Uint8Array([
			...REDA,
			...BLACKA,
			...BLACKA,
			...BLACKA,
			...REDA,
			...BLACKA,
			...BLACKA,
			...BLACKA,
			...REDA,
			...BLACKA,
			...BLACKA,
			...BLACKA,
			...REDA,
			...BLACKA,
			...BLACKA,
			...BLACKA,
		])
		const sourceSize: [number, number] = [4, 4]
		const grid: [number, number] = [4, 4]

		// Polygon covering the whole 4x4 grid
		/**
		 * Polygon Area on Grid (1x4):
		 * +---+---+---+---+
		 * | X |   |   |   |
		 * | X |   |   |   |
		 * | X |   |   |   |
		 * | X |   |   |   |
		 * +---+---+---+---+
		 * Polygon Coords: [0, 0, 1, 0, 1, 4, 0, 4]
		 */
		const polygon = [0, 0, 1, 0, 1, 4, 0, 4] as [number, number, number, number, number, number, number, number]
		const steps = 4
		const w = 0
		const output = new Uint8Array(steps * 5)
		/**
		 * Expected LED Output (4 LEDs):
		 * LED:  0   1   2   3
		 * Col:  R   R   R   R
		 */
		const expected = new Uint8Array(
			[
				[0, ...RED, w], // LED 0 -> red
				[1, ...RED, w], // LED 1 -> red
				[2, ...RED, w], // LED 2 -> red
				[3, ...RED, w], // LED 3 -> red
			].flat()
		)
		const result = mapPixels(sourcePixels, sourceSize, grid, polygon, steps, w, output)
		expect(result.length).toBe(expected.length)
		expect(result).toEqual(expected)
	})

	test("simple horizontal mapping 2", () => {
		// Source: 4x4 image
		/**
		 * Source Pixels (4x4):
		 * +---+---+---+---+
		 * | B | B | G | B |
		 * | B | B | G | B |
		 * | B | B | G | B |
		 * | B | B | G | B |
		 * +---+---+---+---+
		 */
		const sourcePixels = new Uint8Array([
			...BLACKA, // black (B)
			...BLACKA,
			...GREENA, // green (G)
			...GREENA,
			...BLACKA,
			...BLACKA,
			...GREENA,
			...GREENA,
			...BLACKA,
			...BLACKA,
			...GREENA,
			...GREENA,
			...BLACKA,
			...BLACKA,
			...GREENA,
			...GREENA,
		])
		const sourceSize: [number, number] = [4, 4]
		const grid: [number, number] = [4, 4]
		// Polygon covering the whole 4x4 grid
		/**
		 * Polygon Area on Grid (4x4):
		 * +---+---+---+---+
		 * |   |   | X | X |
		 * |   |   | X | X |
		 * |   |   | X | X |
		 * |   |   | X | X |
		 * +---+---+---+---+
		 * Polygon Coords: [2,0, 3,0, 3,3, 2,3]
		 */
		const polygon = [2, 0, 3, 0, 3, 3, 2, 3] as [number, number, number, number, number, number, number, number]
		const steps = 4 // 4 LEDs
		const w = 0 // White channel value
		const output = new Uint8Array(steps * 5)
		/**
		 * Expected LED Output (4 LEDs):
		 * LED:  0   1   2   3
		 * Col:  G   G   G   G
		 */
		const expected = new Uint8Array(
			[
				[0, ...GREEN, w], // LED 0 -> black
				[1, ...GREEN, w], // LED 1 -> black
				[2, ...GREEN, w], // LED 2 -> green
				[3, ...GREEN, w], // LED 3 -> black
			].flat()
		)
		const result = mapPixels(sourcePixels, sourceSize, grid, polygon, steps, w, output)

		console.log("Result:", result)
		console.log("Expected:", expected)

		expect(result.length).toBe(expected.length)
		expect(result).toEqual(expected)
	})
})
