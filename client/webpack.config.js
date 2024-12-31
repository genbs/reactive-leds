const path = require("path")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")

module.exports = {
	entry: {
		app: "./src/index.tsx",
	},

	output: {
		libraryTarget: "umd", // Supporta sia CommonJS che ES6
		filename: "[name].js",
		path: __dirname + "/build",
	},
	// output: {
	// 	library: {
	// 		name: "GydraLED",
	// 		type: "this",
	// 		export: "default",
	// 	},
	// },
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
			template: "./src/index.html",
		}),
		new webpack.DefinePlugin({
			"process.env": JSON.stringify({ ...process.env }),
		}),
		// {
		// 	apply: compiler => {
		// 		compiler.hooks.afterEmit.tap("AfterEmitPlugin", compilation => {
		// 			let filePath = path.resolve(__dirname, "build", "gydra-led.js")
		// 			// copy to examples folder
		// 			fs.copyFileSync(filePath, path.resolve("examples/gydra-led.js"))
		// 		filePath = path.resolve(__dirname, "build", "gydra-led.js.map")
		// 			fs.copyFileSync(filePath, path.resolve("examples/gydra-led.js.map"))
		// 		})
		// 	},
		// },
	],
	devServer: {
		static: {
			directory: path.join(__dirname, "public"),
		},
		compress: true,
		port: 4210,
	},
}
