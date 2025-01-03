import gydraLeds from "@lib"
import { TNetClient } from "@shared"
import React, { useEffect } from "react"

export default function NetClients() {
	const [clients, setClients] = React.useState<TNetClient[]>([])

	useEffect(() => {
		return gydraLeds.onChangeState(state => {
			setClients(state.clients)
		})
	}, [])

	return (
		<div>
			<div>NetClients ({clients.length})</div>

			<div>
				<ul>
					{clients.map(client => (
						<li key={client.ip} onClick={() => gydraLeds.connect(client.ip)}>
							{client.ip} {client.mac} {client.vendor} {client.hostname}
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
