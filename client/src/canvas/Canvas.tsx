import { TStripe } from "@shared"
import { useEffect, useRef } from "react"

import { TMap } from "@lib"
import { mappingUI } from "src/lib/ui/mapping"
import useClientRect from "../hooks/useClientRect"
import { style } from "../utils"

interface CanvasProps {
	map: TMap
	stripes: TStripe[]
	updateStripe: (stripe: TStripe) => void
}

style(`
    .canvas {
        width: 100%;
        height: 100%;
        background: #000;
        overflow: hidden;
    }
`)

export default function Canvas(props: CanvasProps) {
	const [ref, rect] = useClientRect<HTMLDivElement>()
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		if (!canvasRef.current) return

		return mappingUI(canvasRef.current, props.map, props.stripes, props.updateStripe)
	}, [canvasRef.current, props.stripes])

	return (
		<div ref={ref} className="canvas">
			{rect && <canvas className="expand" ref={canvasRef} width={rect.width} height={rect.height} />}
		</div>
	)
}
