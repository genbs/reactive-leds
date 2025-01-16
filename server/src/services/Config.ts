import { EventEmitter, TConfig } from "@shared"
import fs from "fs"
import path from "path"

export type ConfigServiceEvents = {}

export default class ConfigService extends EventEmitter<ConfigServiceEvents> {
	private path: string
	private config: TConfig

	constructor(configPath = "config.json") {
		super()

		this.path = path.resolve(configPath)

		this.config = this.load()
	}

	private load(): TConfig {
		if (!fs.existsSync(this.path)) {
			fs.writeFileSync(this.path, "{}")
		}

		const data = fs.readFileSync(this.path, "utf8") || "{}"
		const config = JSON.parse(data)

		return config
	}

	get() {
		return this.config
	}

	update(config: Partial<TConfig>) {
		this.config = { ...this.config, ...config }

		fs.writeFileSync(this.path, JSON.stringify(this.config, null, 2))
	}
}
