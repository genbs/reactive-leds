import { build } from "esbuild"
import { cp, mkdir } from "node:fs/promises"

await build({
	entryPoints: ["main.ts"],
	bundle: true,
	platform: "node",
	outfile: "bin/rleds.js",
	external: ["@stoprocent/noble", "serialport", "ws"],
	banner: { js: "#!/usr/bin/env node" },
})

await mkdir("bin/ui", { recursive: true })
for (const file of [
	"index.html", "playground.html", "style.css", "main.js", "i18n.json", "favicon.svg",
	"logo-black.svg", "logo-white.svg", "manifest.json", "reactive-leds.js", "reactive-leds.umd.js",
	"reactive-leds.d.ts", "daemon.worker.js",
]) await cp(`../docs/${file}`, `bin/ui/${file}`)
