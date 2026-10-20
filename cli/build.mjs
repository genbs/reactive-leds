import { build } from "esbuild"
import { cp, mkdir, rm } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

await build({
	entryPoints: ["main.ts"],
	bundle: true,
	platform: "node",
	outfile: "bin/rleds.js",
	external: ["@stoprocent/noble", "serialport", "ws"],
	banner: { js: "#!/usr/bin/env node" },
})

await rm("bin/ui", { recursive: true, force: true })
await mkdir("bin/ui", { recursive: true })
for (const file of [
	"index.html", "playground.html", "style.css", "main.js", "i18n.json", "favicon.svg",
	"logo-black.svg", "logo-white.svg", "manifest.json",
]) await cp(join("ui", file), join("bin/ui", file))

const clientBuild = dirname(createRequire(import.meta.url).resolve("@reactive-leds/client"))
for (const file of ["reactive-leds.js", "daemon.worker.js"])
	await cp(join(clientBuild, file), join("bin/ui", file))
