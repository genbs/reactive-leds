export default class EventEmitter<T extends Record<string, (...args: any[]) => void>> {
	private listeners = new Map<keyof T, Set<T[keyof T]>>()

	on<K extends keyof T>(event: K, listener: T[K]): () => void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set())
		}

		this.listeners.get(event)!.add(listener)

		return () => this.off(event, listener)
	}

	off<K extends keyof T>(event: K, listener: T[K]): void {
		this.listeners.get(event)?.delete(listener)
	}

	emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
		const listeners = this.listeners.get(event)
		if (listeners) {
			for (const listener of listeners) {
				listener(...args)
			}
		}
	}

	removeAllListeners() {
		this.listeners.clear()
	}
}
