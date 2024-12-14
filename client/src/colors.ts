import { Color } from "@shared"

/**
 * Brightness [0-255]
 *
 * @export
 * @param {Color} [r, g, b]
 * @return {*}  {number from 0 to 255}
 */
export function brightness([r, g, b, a]: Color): number {
	return a && a > 0 ? (r * 299 + g * 587 + b * 114) / 1000 : 0
}

/**
 * Luminance [0-1]
 *
 * @export
 * @param {Color} [r, g, b]
 * @return {*}  {number from 0 to 1}
 */
export function luminance([r, g, b, a]: Color): number {
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function isDark([r, g, b, a]: Color): boolean {
	return !isLight([r, g, b, a])
}

export function isLight([r, g, b, a]: Color): boolean {
	return brightness([r, g, b, a]) >= 128
}
