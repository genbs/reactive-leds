import { describe, expect, test } from "@jest/globals"
import { sample } from "../src/mapping"

const RED = [255, 0, 0]
const GREEN = [0, 255, 0]
const BLUE = [0, 0, 255]
const WHITE = [255, 255, 255]
const BLACK = [0, 0, 0]
const YELLOW = [255, 255, 0]
const MAGENTA = [255, 0, 255]
const REDA = [...RED, 255]
const GREENA = [...GREEN, 255]
const BLUEA = [...BLUE, 255]
const WHITEA = [...WHITE, 255]
const BLACKA = [...BLACK, 255]
const YELLOWA = [...YELLOW, 255]
const MAGENTAA = [...MAGENTA, 255]

type Polygon = [number, number, number, number, number, number, number, number]

describe("mapping module", () => {
	test("vertical strip: one LED per row, top to bottom", () => {
		/**
		 * Source Pixels (1x4):
		 * +----+
		 * | B  | row 0
		 * +----+
		 * | R  | row 1
		 * +----+
		 * | G  | row 2
		 * +----+
		 * | Bl | row 3
		 * +----+
		 */
		const sourcePixels = new Uint8Array([...BLACKA, ...REDA, ...GREENA, ...BLUEA])
		const sourceSize: [number, number] = [1, 4]
		const grid: [number, number] = [1, 4]

		/**
		 * Polygon Area on Grid (1x4): covers everything, start edge on TOP
		 * +----+
		 * | X  | ← start edge (TL→TR), LED 0
		 * +----+
		 * | X  |
		 * +----+
		 * | X  |
		 * +----+
		 * | X  | ← end edge (BL→BR), LED 3
		 * +----+
		 * Polygon Coords: [0,0, 1,0, 1,4, 0,4]
		 */
		const polygon: Polygon = [0, 0, 1, 0, 1, 4, 0, 4]
		const steps = 4
		const w = 0

		const output = new Uint8Array(steps * 4)
		/**
		 * Expected LED Output (4 LEDs):
		 * LED:  0   1   2   3
		 * Col:  B   R   G   Bl
		 */
		const expected = new Uint8Array(
			[
				[...BLACK, w],
				[...RED, w],
				[...GREEN, w],
				[...BLUE, w],
			].flat()
		)

		const result = sample(sourcePixels, sourceSize, grid, polygon, steps, w, output)

		expect(result.length).toBe(expected.length)
		expect(result).toEqual(expected)
	})

	test("horizontal strip: rotated polygon, one LED per column", () => {
		/**
		 * Source Pixels (4x1):
		 * +---+---+---+----+
		 * | B | R | G | Bl |
		 * +---+---+---+----+
		 */
		const sourcePixels = new Uint8Array([...BLACKA, ...REDA, ...GREENA, ...BLUEA])
		const sourceSize: [number, number] = [4, 1]
		const grid: [number, number] = [4, 1]

		/**
		 * Polygon Area on Grid (4x1): covers everything, ROTATED so the start
		 * edge (TL→TR) is the LEFT side and the centerline sweeps left → right.
		 *
		 *   start           end
		 *    edge           edge
		 *     ↓               ↓
		 *    +---+---+---+---+
		 *    | X | X | X | X |
		 *    +---+---+---+---+
		 *    LED0 →→→→→→→ LED3
		 *
		 * Polygon Coords: [0,0, 0,1, 4,1, 4,0]  (TL=(0,0) TR=(0,1) BR=(4,1) BL=(4,0))
		 */
		const polygon: Polygon = [0, 0, 0, 1, 4, 1, 4, 0]
		const steps = 4
		const w = 0

		/**
		 * Expected LED Output (4 LEDs):
		 * LED:  0   1   2   3
		 * Col:  B   R   G   Bl
		 */
		const expected = new Uint8Array(
			[
				[...BLACK, w],
				[...RED, w],
				[...GREEN, w],
				[...BLUE, w],
			].flat()
		)

		const result = sample(sourcePixels, sourceSize, grid, polygon, steps, w)
		expect(result).toEqual(expected)
	})

	test("keeps exact pixel-boundary samples on the expected pixel", () => {
		const pixels = new Uint8Array(64 * 4)
		pixels.set(GREENA, 31 * 4)
		const polygon: Polygon = [15.5, 0, 15.5, 1, 0.5, 1, 0.5, 0]

		const result = sample(pixels, [64, 1], [16, 1], polygon, 30)

		expect(result.slice(15 * 4, 16 * 4)).toEqual(new Uint8Array([...GREEN, 0]))
	})

	test("reversed polygon flips the strip direction", () => {
		/**
		 * Source Pixels (1x4):        Polygon: same area, but the start edge
		 * +----+                      (TL→TR) is at the BOTTOM — the centerline
		 * | B  | row 0 ← LED 3        runs bottom → top, so the strip is flipped.
		 * +----+
		 * | R  | row 1
		 * +----+
		 * | G  | row 2
		 * +----+
		 * | Bl | row 3 ← LED 0
		 * +----+
		 * Polygon Coords: [0,4, 1,4, 1,0, 0,0]
		 */
		const sourcePixels = new Uint8Array([...BLACKA, ...REDA, ...GREENA, ...BLUEA])
		const polygon: Polygon = [0, 4, 1, 4, 1, 0, 0, 0]

		/**
		 * Expected LED Output (4 LEDs):
		 * LED:  0   1   2   3
		 * Col:  Bl  G   R   B
		 */
		const expected = new Uint8Array(
			[
				[...BLUE, 0],
				[...GREEN, 0],
				[...RED, 0],
				[...BLACK, 0],
			].flat()
		)

		const result = sample(sourcePixels, [1, 4], [1, 4], polygon, 4)
		expect(result).toEqual(expected)
	})

	test("offset polygon reads only its own grid region", () => {
		/**
		 * Source Pixels (4x4):
		 * +---+---+---+---+
		 * | B | B | G | G | row 0
		 * +---+---+---+---+
		 * | B | B | G | G | row 1
		 * +---+---+---+---+
		 * | B | B | G | G | row 2
		 * +---+---+---+---+
		 * | B | B | G | G | row 3
		 * +---+---+---+---+
		 */
		const sourcePixels = new Uint8Array(
			Array(4)
				.fill([...BLACKA, ...BLACKA, ...GREENA, ...GREENA])
				.flat()
		)
		const sourceSize: [number, number] = [4, 4]
		const grid: [number, number] = [4, 4]

		/**
		 * Polygon Area on Grid (4x4): covers only the RIGHT half
		 * +---+---+---+---+
		 * |   |   | X | X |
		 * +---+---+---+---+
		 * |   |   | X | X |
		 * +---+---+---+---+
		 * |   |   | X | X |
		 * +---+---+---+---+
		 * |   |   | X | X |
		 * +---+---+---+---+
		 * Polygon Coords: [2,0, 4,0, 4,4, 2,4]
		 */
		const polygon: Polygon = [2, 0, 4, 0, 4, 4, 2, 4]
		const steps = 4

		/**
		 * Expected LED Output (4 LEDs): centerline runs down x=3 → all green
		 * LED:  0   1   2   3
		 * Col:  G   G   G   G
		 */
		const expected = new Uint8Array(
			[
				[...GREEN, 0],
				[...GREEN, 0],
				[...GREEN, 0],
				[...GREEN, 0],
			].flat()
		)

		const result = sample(sourcePixels, sourceSize, grid, polygon, steps)
		expect(result).toEqual(expected)
	})

	test("samples the centerline, ignoring the polygon width", () => {
		/**
		 * Source Pixels (3x4): left column all red, right column all white,
		 * center column a top-to-bottom gradient. The strip must read ONLY the
		 * center column.
		 * +----+----+----+
		 * | R  | G  | W  | row 0
		 * +----+----+----+
		 * | R  | Bl | W  | row 1
		 * +----+----+----+
		 * | R  | Y  | W  | row 2
		 * +----+----+----+
		 * | R  | M  | W  | row 3
		 * +----+----+----+
		 */
		const sourcePixels = new Uint8Array(
			[
				[...REDA, ...GREENA, ...WHITEA],
				[...REDA, ...BLUEA, ...WHITEA],
				[...REDA, ...YELLOWA, ...WHITEA],
				[...REDA, ...MAGENTAA, ...WHITEA],
			].flat()
		)
		const sourceSize: [number, number] = [3, 4]
		const grid: [number, number] = [3, 4]

		/**
		 * Polygon Area on Grid (3x4): covers everything — but only the
		 * centerline (x=1.5) is sampled:
		 * +----+----+----+
		 * | X  | X• | X  |
		 * +----+----+----+
		 * | X  | X• | X  |
		 * +----+----+----+
		 * | X  | X• | X  |
		 * +----+----+----+
		 * | X  | X• | X  |
		 * +----+----+----+
		 * Polygon Coords: [0,0, 3,0, 3,4, 0,4]     (• = sampled point)
		 */
		const polygon: Polygon = [0, 0, 3, 0, 3, 4, 0, 4]
		const steps = 4

		/**
		 * Expected LED Output (4 LEDs): the center-column gradient
		 * LED:  0   1   2   3
		 * Col:  G   Bl  Y   M
		 */
		const expected = new Uint8Array(
			[
				[...GREEN, 0],
				[...BLUE, 0],
				[...YELLOW, 0],
				[...MAGENTA, 0],
			].flat()
		)

		const result = sample(sourcePixels, sourceSize, grid, polygon, steps)
		expect(result).toEqual(expected)
	})

	test("wa as function maps r,g,b to white channel", () => {
		/**
		 * Source Pixels (1x1):         wa = (r, g, b) => r
		 * +--------------+
		 * | rgb(100,0,0) |  →  LED 0 = [100, 0, 0, w=100]
		 * +--------------+
		 */
		const sourcePixels = new Uint8Array([100, 0, 0, 255])
		const result = sample(sourcePixels, [1, 1], [1, 1], [0, 0, 1, 0, 1, 1, 0, 1], 1, (r, _g, _b) => r)
		expect(result[3]).toBe(100)
	})

	test("wa=true uses source alpha as white channel", () => {
		/**
		 * Source Pixels (1x1):         wa = true → white channel = source alpha
		 * +------------------+
		 * | rgba(255,0,0,128)|  →  LED 0 = [255, 0, 0, w=128]
		 * +------------------+
		 */
		const sourcePixels = new Uint8Array([255, 0, 0, 128])
		const result = sample(sourcePixels, [1, 1], [1, 1], [0, 0, 1, 0, 1, 1, 0, 1], 1, true)
		expect(result[3]).toBe(128)
	})

	test("writes into the provided output buffer and returns it", () => {
		/**
		 * Source Pixels (1x1):         wa = 42 (fixed white)
		 * +-----+
		 * | R   |  →  output buffer = [255, 0, 0, 42]
		 * +-----+
		 */
		const sourcePixels = new Uint8Array([...REDA])
		const output = new Uint8Array(4)
		const result = sample(sourcePixels, [1, 1], [1, 1], [0, 0, 1, 0, 1, 1, 0, 1], 1, 42, output)
		expect(result).toBe(output)
		expect([...output]).toEqual([...RED, 42])
	})
})
