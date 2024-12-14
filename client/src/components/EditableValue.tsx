import { createRef, useEffect, useState } from "react"
import useClickOutside from "src/hooks/useClickOutside"
import { style } from "src/utils"

style(`
    .editable-value {
        cursor: pointer;
        line-height: 1.5;
        height: 1.5rem;
        margin: 0;
        padding: 0;
    }	

    .editable-value--view {
        display: inline-block;
    }

    .editable-value--editing {
        background-color: transparent;
        border: none;
        apperance: none;
        color: inherit;
    }

    .editable-button {
        cursor: pointer;
        display: inline-block;
        line-height: 1.5;
        height: 1.5rem;
        margin: 0;
        padding: 0 .5rem;
        font-size: 1rem;	
    }
`)

type EditableValueProps<T> = {
	value: T
	onChange: (value: T) => void
	min?: number
	max?: number
	type: "number" | "text"
}

export default function EditableValue<T extends string | number>(props: EditableValueProps<T>) {
	const [editing, setEditing] = useState(false)
	const [value, setValue] = useState<T>(props.value)
	const ref = createRef<HTMLSpanElement>()

	useEffect(() => setValue(props.value), [props.value])

	useClickOutside(ref, () => setEditing(false))

	return (
		<span className="editable-value-container" ref={ref}>
			{editing ? (
				<>
					<input
						className="editable-value editable-value--editing"
						type={props.type}
						value={value}
						onChange={e => setValue((typeof props.value === "number" ? parseInt(e.target.value) : e.target.value) as T)}
						min={props.min}
						max={props.max}
					/>

					<span className="editable-button" onClick={() => props.onChange(value)}>
						✓
					</span>
				</>
			) : (
				<span className="editable-value editable-value--view" onClick={() => setEditing(true)}>
					{props.value}
				</span>
			)}
		</span>
	)
}
