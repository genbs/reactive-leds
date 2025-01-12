const path = require("path")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const fs = require("fs")

module.exports = {
	entry: {
		mapping: "./src/mapping/index.tsx",
		lib: "./src/lib/index.ts",
	},

	output: {
		libraryTarget: "umd", // Supporta sia CommonJS che ES6
		filename: "[name].js",
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
							esModule: true, // Questo garantisce l'export di default
							inline: "fallback", // (Opzionale) Per gestione fallback
						},
					},
				],
			},
			{
				test: /\.tsx?$/,
				loader: "ts-loader",
			},
		],
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"],
		plugins: [new TsconfigPathsPlugin()],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./src/mapping/index.html",
		}),
		new webpack.DefinePlugin({
			"process.env": JSON.stringify({ ...process.env }),
		}),
		{
			apply: compiler => {
				compiler.hooks.afterEmit.tap("AfterEmitPlugin", compilation => {
					let filePath = path.resolve(__dirname, "build", "lib.js")
					fs.copyFileSync(filePath, path.resolve("examples/lib.js"))
					fs.copyFileSync(filePath, path.resolve("../../../exts/leds.js"))

					filePath = path.resolve(__dirname, "build", "lib.js.map")
					fs.copyFileSync(filePath, path.resolve("examples/lib.js.map"))
					fs.copyFileSync(filePath, path.resolve("../../../exts/leds.map.js"))
				})
			},
		},
	],
	devServer: {
		static: {
			directory: path.join(__dirname, "public"),
		},
		compress: true,
		port: 4210,
	},
}
