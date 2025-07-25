const path = require("path")
const webpack = require("webpack")
const fs = require("fs")

module.exports = {
	entry: "./src/main.ts",

	output: {
		libraryTarget: "umd",
		filename: "leds.js",
		path: __dirname + "/build",
		library: {
			name: "leds",
			type: "this",
			export: "default",
		},
	},
	devtool: "source-map",
	module: {
		rules: [
			{
				test: /\.worker\.ts$/,
				use: [
					{
						loader: "worker-loader",
						options: {
							esModule: true,
						},
					},
				],
			},
			{
				test: /\.tsx?$/,
				loader: "ts-loader",
				options: {
					projectReferences: true,
				},
			},
		],
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"],
	},
	plugins: [
		new webpack.DefinePlugin({
			"process.env": JSON.stringify({ ...process.env }),
		}),
		{
			apply: compiler => {
				// compiler.hooks.afterEmit.tap("AfterEmitPlugin", compilation => {
				// 	let filePath = path.resolve(__dirname, "build", "main.js")
				// 	fs.copyFileSync(filePath, path.resolve("examples/lib.js"))
				// 	fs.copyFileSync(filePath, path.resolve("../../../exts/leds.js"))
				// 	filePath = path.resolve(__dirname, "build", "main.js.map")
				// 	fs.copyFileSync(filePath, path.resolve("examples/lib.js.map"))
				// 	fs.copyFileSync(filePath, path.resolve("../../../exts/leds.map.js"))
				// 	filePath = path.resolve(__dirname, "build", "deamon.worker.worker.js")
				// 	fs.copyFileSync(filePath, path.resolve("../../../exts/deamon.worker.worker.js"))
				// })
			},
		},
	],
	devServer: {
		static: {
			directory: path.join(__dirname, "examples"),
		},
		compress: true,
		port: 3000,
	},
}
