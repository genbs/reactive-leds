import { ReactNode, useState } from "react"

interface DropdownProps {
	children?: ReactNode | [ReactNode, ReactNode]
}

export default function Dropdown(props: DropdownProps) {
	const [open, setOpen] = useState(false)

	const [title, content] = Array.isArray(props.children)
		? props.children.length === 2
			? props.children
			: [props.children[0], null]
		: [props.children, null]

	if (!content) {
		return title
	}

	return (
		<>
			<div className="flex flex--justify-between flex--v-center gap">
				{title}
				<span className="unicode pd--1 pointer" onClick={() => setOpen(!open)}>
					{open ? "▶" : "▼"}
				</span>
			</div>
			{open && content}
		</>
	)
}
