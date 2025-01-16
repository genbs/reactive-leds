import { useEffect, useState } from "react"

import GydraLEDs from "@lib"
import { TNetClient } from "@shared"

export default function NetClients() {
	const [clients, setClients] = useState<TNetClient[]>([])

	useEffect(() => {
		return GydraLEDs.onChangeState(state => {
			setClients(state.clients)
		})
	}, [])

	return (
		<div>
			<div>NetClients ({clients.length})</div>

			<div>
				<ul>
					{clients.map(client => (
						<li key={client.address} onClick={() => GydraLEDs.connect(client.address)}>
							{client.address} {client.mac} {client.vendor} {client.hostname}
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
