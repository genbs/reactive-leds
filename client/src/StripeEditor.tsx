import { useState } from "react"
import useStripes from "./hooks/useStripes"
import { Stripe } from "./Stripe"
import { style } from "./utils"

interface StripeEditorProps {
	stripe: Stripe
}

style(`
    .editor {
    }

    .editor__textarea {
        width: 100%;
        resize: none;
        min-height: 200px;
        font-family: monospace;
        background: transparent;
        padding: 1rem;
        border-radius: 0.5rem;
    }
`)

export default function StripeEditor(props: StripeEditorProps) {
	const [code, setCode] = useState(props.stripe.code)
	const [stripes, updateStripe] = useStripes()

	function updateCode() {
		updateStripe([{ ...props.stripe, code }])
	}

	return (
		<div className="editor">
			<textarea
				style={{
					borderColor: props.stripe.colorHex,
					color: props.stripe.colorHex,
				}}
				className="editor__textarea"
				value={props.stripe.code}
				onChange={e => setCode(e.target.value)}
			/>
			{code !== props.stripe.code && <button onClick={updateCode}>✓</button>}
		</div>
	)
}
