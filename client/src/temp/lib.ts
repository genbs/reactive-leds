/**
 * Random element from array
 *
 * @param {Array<number>} a
 * @param {number} index
 * @returns {number}
 */
export function randomElement(a: Array<number>): number {
	return a[Math.floor(Math.random() * a.length)]
}

/**
 * Generate matrix
 *
 * @export
 * @param {number} size
 * @param {((i: number, j: number, matrix: Array<Array<number>>) => number | number)} value
 * @return {*}
 */
export function matrix(
	rows: number,
	cols: number,
	value: (i: number, j: number, matrix: Array<Array<number>>) => number | number
) {
	const matrix = new Array(rows)

	return matrix
		.fill(undefined)
		.map((_, i, row) =>
			new Array(cols).fill(undefined).map((_, j, col) => (typeof value === "function" ? value(i, j, matrix) : value))
		)
}

/**
 * Each matrix and return a new matrix
 *
 * @export
 * @param {Array<Array<number>>} matrix
 * @param {(rowIndex: number, colIndex: number, matrix: Array<Array<number>>) => number | number} value
 * @return {*}  {Array<Array<number>>}
 */
export function eachMatrix(
	matrix: Array<Array<number>>,
	value: (value: number, rowIndex: number, colIndex: number, matrix: Array<Array<number>>) => number | number
): Array<Array<number>> {
	return matrix.map((row, rowIndex) =>
		row.map((col, colIndex) => (typeof value === "function" ? value(col, rowIndex, colIndex, matrix) : value))
	)
}

/**
 * Return angle (atan) from offset (or center) for matrix repetition.
 * Offset is array between [-1, -1] and [1, 1].
 * The return value is between -Math.PI / 2 and Math.PI / 2
 *
 * @param {Array<Array<number>>} matrix
 * @param {[number, number]} offsetFromCenter
 * @returns {number} between -Math.PI / 2 and Math.PI / 2
 */
export function angleFromMatrix(
	matrix: Array<Array<number>>,
	rowIndex: number,
	colIndex: number,
	offsetFromCenter: [number, number] = [0, 0]
): number {
	const centerMatrix = [(matrix[0].length - 1) / 2, (matrix.length - 1) / 2]

	centerMatrix[0] += centerMatrix[0] * offsetFromCenter[0]
	centerMatrix[1] += centerMatrix[1] * offsetFromCenter[1]

	const x = colIndex - centerMatrix[0]
	const y = rowIndex - centerMatrix[1]

	return x === 0 ? 0 : Math.atan(y / x)
}

/**
 * Return angle (atan2, 4 quadrants) from offset (or center) for matrix repetition.
 * Offset is array between [-1, -1] and [1, 1].
 * The return value is between -Math.PI an Math.PI
 *
 * @param {Array<Array<number>>} matrix
 * @param {[number, number]} offsetFromCenter
 * @returns {number} between -Math.PI an Math.PI
 */
export function angle2FromMatrix(
	matrix: Array<Array<number>>,
	rowIndex: number,
	colIndex: number,
	offsetFromCenter: [number, number] = [0, 0]
): number {
	const centerMatrix = [(matrix[0].length - 1) / 2, (matrix.length - 1) / 2]

	centerMatrix[0] += centerMatrix[0] * offsetFromCenter[0]
	centerMatrix[1] += centerMatrix[1] * offsetFromCenter[1]

	const x = colIndex - centerMatrix[0]
	const y = rowIndex - centerMatrix[1]

	return x === 0 ? 0 : Math.atan2(y, x)
}

/**
 * Return distance from offset (or center) for matrix repetition.
 * The return value is between 0 and 1
 *
 * @param {Array<Array<number>>} matrix
 * @param {[number, number]} offsetFromCenter offset relative to distance prop
 * @returns {number} between 0 and 1
 */
export function distanceFromMatrix(
	matrix: Array<Array<number>>,
	rowIndex: number,
	colIndex: number,
	offsetFromCenter: [number, number] = [0, 0]
): number {
	const centerMatrix = [0.5, 0.5]

	centerMatrix[0] += centerMatrix[0] * offsetFromCenter[0]
	centerMatrix[1] += centerMatrix[1] * offsetFromCenter[1]

	const current = [colIndex / (matrix[0].length - 1), rowIndex / (matrix.length - 1)]

	return Math.hypot(current[0] - centerMatrix[0], current[1] - centerMatrix[1])
}

export function lerp(a: number, b: number, i: number): number {
	return (1 - i) * a + i * b
}

export function clamp(value: number, min: number = 0, max: number = 1): number {
	return value <= min ? min : value >= max ? max : value
}

export function map(value: number, refMin: number, refMax: number, toMin: number, toMax: number): number {
	return clamp(toMin, toMax, ((value - refMin) / (refMax - refMin)) * (toMax - toMin) + toMin)
}

export function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180
}

export function toDegrees(radians: number): number {
	return (radians * 180) / Math.PI
}
