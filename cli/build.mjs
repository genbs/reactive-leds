import { build } from "esbuild"
import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises"
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

const version = JSON.parse(
	await readFile("package.json", "utf8")
).version

const indexPath = join("bin", "ui", "index.html")
const html = await readFile(indexPath, "utf8")

const versionPlaceholder = "__SOFTWARE_VERSION__"
const versionPlaceholderCount = html.split(versionPlaceholder).length - 1
if (versionPlaceholderCount !== 1) {
	throw new Error(`Expected one software version placeholder, found ${versionPlaceholderCount}`)
}

await writeFile(
	indexPath,
	html.replace("__SOFTWARE_VERSION__", version)
)

const manifestPath = join("bin", "ui", "manifest.json")
const manifest = JSON.parse(await readFile(manifestPath, "utf8"))

for (const build of manifest.builds) {
	for (const part of build.parts) {
		part.path = new URL(
			part.path,
			"https://reactive-leds.genbs.dev/"
		).href
	}
}

await writeFile(
	manifestPath,
	JSON.stringify(manifest, null, 2) + "\n"
)

const clientBuild = dirname(createRequire(import.meta.url).resolve("@reactive-leds/client"))
for (const file of ["reactive-leds.js", "daemon.worker.js"])
	await cp(join(clientBuild, file), join("bin/ui", file))
