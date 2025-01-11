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
						<li key={client.ip} onClick={() => GydraLEDs.connect(client.ip)}>
							{client.ip} {client.mac} {client.vendor} {client.hostname}
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
