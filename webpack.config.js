const fs = require("fs")
const path = require("path")

module.exports = {
	entry: {
		["gydra-led"]: path.resolve(__dirname, "./src/index"),
	},

	output: {
		filename: "[name].js",
		path: __dirname + "/build",
		library: {
			name: "GydraLED",
			type: "this",
			export: "default",
		},
	},
	devtool: "source-map",
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"],
	},
	module: {
		rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
	},
	plugins: [
		{
			apply: compiler => {
				compiler.hooks.afterEmit.tap("AfterEmitPlugin", compilation => {
					let filePath = path.resolve(__dirname, "build", "gydra-led.js")
					// copy to examples folder
					fs.copyFileSync(filePath, path.resolve("examples/gydra-led.js"))

					filePath = path.resolve(__dirname, "build", "gydra-led.js.map")
					fs.copyFileSync(filePath, path.resolve("examples/gydra-led.js.map"))
				})
			},
		},
	],
	devServer: {
		static: {
			directory: path.join(__dirname, "examples"),
		},
		compress: true,
		port: 9000,
	},
}
