import { EStripeOrientation, TStripe } from "@shared"
import { useEffect, useRef } from "react"
import { TMap } from "src/context"
import { mapStripeOnData } from "src/lib"
import { colorToHex } from "src/utils"
import { draw } from "./utils"

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

export function StripePreview(props: StripePreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext("2d")
		if (!ctx) return

		const { pixels, width, height } = mapStripeOnData(props.data, props.dataSize, props.map.gridSize, props.stripe)
		console.log(width, height)
		canvas.width = width
		canvas.height = height
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		const imageData = new ImageData(new Uint8ClampedArray(pixels.buffer), width, height)

		ctx.putImageData(imageData, 0, 0)
	}, [props.data, props.stripe, props.map, props.dataSize])

	const s = 20
	return (
		<div
			style={{
				border: `2px solid ${colorToHex(props.stripe.color)}`,
				height:
					props.stripe.map.orientation === EStripeOrientation.Horizontal ||
					props.stripe.map.orientation === EStripeOrientation.HorizontalReverse
						? `${s}px`
						: `${s * props.stripe.device.num_leds}px`,
				width:
					props.stripe.map.orientation === EStripeOrientation.Horizontal ||
					props.stripe.map.orientation === EStripeOrientation.HorizontalReverse
						? `${s * props.stripe.device.num_leds}px`
						: `${s}px`,
			}}
		>
			<canvas ref={canvasRef} className="expand" />
		</div>
	)
}
