import { useRef, useState } from "react"
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

	.editor__snippet {
		border: 1px solid var(--color);
		padding: 0.3rem;
		border-radius: 0.3rem;
		cursor: pointer;
	}
`)

export default function StripeEditor(props: StripeEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [code, setCode] = useState(props.stripe.code)
	const [stripes, updateStripe] = useStripes()

	function updateCode() {
		if (isValidCode(code)) {
			updateStripe([{ ...props.stripe, code: code.trim() }])
		}
	}

	function isValidCode(code: string) {
		try {
			new Function(code)
			return true
		} catch (e) {
			return false
		}
	}

	function addSnippet(snippet: string) {
		if (!textareaRef.current) return

		const start = textareaRef.current.selectionStart
		const end = textareaRef.current.selectionEnd

		const before = code.slice(0, start)
		const after = code.slice(end)

		setCode(`${before}${snippet}${after}`)
	}

	const snippets = [
		{ label: `index (0-${props.stripe.num_leds})`, code: "led.index" },
		{ label: "offset (0-1)", code: "led.offset" },
		{ label: "prev color ([r,g,b,w])", code: "led.color" },
		{ label: "time", code: "time" },
	]

	return (
		<div className="flex flex--column gap editor" style={{ ["--color" as string]: props.stripe.colorHex }}>
			<div>
				<div className="flex flex-columns gap">
					{snippets.map(({ label, code }, i) => (
						<span className="editor__snippet" key={i} onClick={() => addSnippet(code)}>
							{label}
						</span>
					))}
				</div>
			</div>

			<textarea
				ref={textareaRef}
				style={{
					borderColor: props.stripe.colorHex,
					color: props.stripe.colorHex,
				}}
				className="editor__textarea"
				value={code}
				onKeyDown={e => {
					if (e.key === "Tab") {
						e.preventDefault()
						const start = e.currentTarget.selectionStart
						const end = e.currentTarget.selectionEnd

						const before = code.slice(0, start)
						const after = code.slice(end)

						setCode(`${before}    ${after}`)
					} else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
						isValidCode(code) && updateCode()
					}
				}}
				onChange={e => setCode(e.target.value)}
			/>
			<div>{code !== props.stripe.code && isValidCode(code) && <button onClick={updateCode}>✓</button>}</div>
		</div>
	)
}
