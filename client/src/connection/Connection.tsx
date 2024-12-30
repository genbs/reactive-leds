import { style } from "src/utils"

import { useActionState, useState } from "react"
import { sendCredential } from "src/lib/bluetooth"

style(`
    .modal-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255,255,255, 0.1);
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .modal {
        background: #000;
        padding: 1rem;
        margin-top: 5rem;
        border-radius: 0.5rem;
        display: flex;
    }    
`)

export default function Connection() {
	const [open, setOpen] = useState(false)
	const [error, submitAction, isPending] = useActionState(async (previousState, formData) => {
		const ssid = formData.get("ssid")
		const password = formData.get("password")

		const error = sendCredential(ssid, password)

		if (error) {
			return error
		}

		return null
	}, null)

	return (
		<div>
			<button onClick={() => setOpen(true)}>OPEN</button>

			{open && (
				<div className="modal-container">
					<div className="modal">
						<form action={submitAction}>
							<input type="text" name="ssid" placeholder="SSID" />
							<input type="password" name="password" placeholder="Password" />
							<button type="submit" disabled={isPending}>
								Save
							</button>

							{error && <div>{error}</div>}
						</form>

						<button onClick={() => setOpen(false)}>CLOSE</button>
					</div>
				</div>
			)}
		</div>
	)
}
