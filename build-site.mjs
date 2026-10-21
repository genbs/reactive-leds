import { cp, mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

await mkdir("docs", { recursive: true })

for (const file of [
	"index.html", "playground.html", "style.css", "main.js", "i18n.json", "favicon.svg",
	"logo-black.svg", "logo-white.svg", "manifest.json",
]) await cp(join("cli/ui", file), join("docs", file))

for (const file of [
	"reactive-leds.js", "reactive-leds.umd.js", "reactive-leds.d.ts", "daemon.worker.js",
]) await cp(join("client/build", file), join("docs", file))

const version = JSON.parse(
	await readFile("cli/package.json", "utf8")
).version

const indexPath = join("docs", "index.html")
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
