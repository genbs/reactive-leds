import { cp } from "node:fs/promises"
import { join } from "node:path"

for (const file of [
	"index.html", "playground.html", "style.css", "main.js", "i18n.json", "favicon.svg",
	"logo-black.svg", "logo-white.svg", "manifest.json",
]) await cp(join("cli/ui", file), join("docs", file))

for (const file of [
	"reactive-leds.js", "reactive-leds.umd.js", "reactive-leds.d.ts", "daemon.worker.js",
]) await cp(join("client/build", file), join("docs", file))
