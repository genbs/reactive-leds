import { TStripe } from "@shared"
import { useEffect, useRef } from "react"
import { stripeRect } from "src/canvas/utils"
import { TMap } from "src/context"
import { colorToHex } from "src/utils"
import { draw, extractStripeData } from "./utils"

interface PreviewProps {
	map: TMap
	stripes: TStripe[]
	data: Uint8Array // ora solo Uint8Array
	dataSize: [number, number]
}

export default function Preview(props: PreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		draw(canvasRef, props.data, props.dataSize)
	}, [canvasRef.current, props.data])

	return (
		<div className="flex expand" style={{ height: "50vh" }}>
			<div className="flex-1 expand">
				<canvas ref={canvasRef} />
			</div>
			<div className="flex-1 flex">
				{props.stripes.map((stripe, i) => (
					<StripePreview key={i} map={props.map} stripe={stripe} data={props.data} dataSize={props.dataSize} />
				))}
			</div>
		</div>
	)
}

interface StripePreviewProps {
	map: TMap
	stripe: TStripe
	data: Uint8Array
	dataSize: [number, number]
}

function getPixel(imageData: ImageData, x: number, y: number): [number, number, number, number] {
	const { width } = imageData
	const index = (Math.floor(y) * width + Math.floor(x)) * 4
	const d = imageData.data
	return [d[index], d[index + 1], d[index + 2], d[index + 3]]
}

export function StripePreview(props: StripePreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext("2d")
		if (!ctx) return

		const rect = stripeRect(props.stripe)

		const cellCountX = rect.x2 - rect.x1
		const cellCountY = rect.y2 - rect.y1

		canvas.width = cellCountX / props.stripe.map.scale[0]
		canvas.height = cellCountY / props.stripe.map.scale[1]

		ctx.clearRect(0, 0, canvas.width, canvas.height)

		const { pixels, width, height } = extractStripeData(
			props.data,
			props.dataSize,
			props.map.gridSize,
			rect,
			props.stripe.map.scale
		)
		console.log(width, height)
		const imageData = new ImageData(new Uint8ClampedArray(pixels.buffer), width, height)

		ctx.putImageData(imageData, 0, 0)
	}, [props.data, props.stripe, props.map, props.dataSize])

	return (
		<div
			style={{
				border: `2px solid ${colorToHex(props.stripe.color)}`,
				height: "50vh",
				width: `${50 / props.stripe.device.num_leds}vh`,
			}}
		>
			<canvas ref={canvasRef} className="expand" />
		</div>
	)
}
