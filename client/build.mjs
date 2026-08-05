// Build script for @reactive-leds/client.
// Produces four artifacts in build/:
//   - reactive-leds.js       ESM bundle (import / <script type="module">)
//   - reactive-leds.umd.js   UMD bundle (require / AMD / <script> global `rleds`)
//   - reactive-leds.d.ts     bundled type declarations (IDE autocomplete)
//   - daemon.worker.js       module worker, loaded at runtime next to either bundle
import { execSync } from "child_process"
import { build } from "esbuild"

// esbuild has no native UMD output: wrap its IIFE in the classic UMD factory.
// The global/exported value is the API object itself (the module's default
// export). Browser scripts get the short `rleds` name plus the backwards-
// compatible `reactiveLeds` alias.
const umdBanner = `(function (root, factory) {
	if (typeof define === 'function' && define.amd) define(factory)
	else if (typeof module === 'object' && module.exports) module.exports = factory()
	else {
		var api = factory()
		root.rleds = api
		root.reactiveLeds = api
	}
})(typeof self !== 'undefined' ? self : globalThis, function () {`
const umdFooter = `return rleds.default })`

await build({
	entryPoints: ["src/main.ts"],
	bundle: true,
	format: "esm",
	outfile: "build/reactive-leds.js",
})

await build({
	entryPoints: ["src/main.ts"],
	bundle: true,
	format: "iife",
	globalName: "rleds",
	banner: { js: umdBanner },
	footer: { js: umdFooter },
	outfile: "build/reactive-leds.umd.js",
	// import.meta doesn't exist outside ESM; esbuild lowers it to an empty
	// object and proxy.ts falls back to document.currentScript. Expected.
	logOverride: { "empty-import-meta": "silent" },
})

await build({
	entryPoints: ["src/daemon.worker.ts"],
	bundle: true,
	format: "esm",
	outfile: "build/daemon.worker.js",
})

// Type declarations, bundled into a single file: the public API references
// types from @reactive-leds/shared, which is a private workspace package —
// they must be inlined, just like esbuild inlines the JS.
execSync(
	"npx dts-bundle-generator -o build/reactive-leds.d.ts --project tsconfig.json --no-check --export-referenced-types src/main.ts",
	{ stdio: "inherit" }
)
