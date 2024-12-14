const path = require("path")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")

module.exports = {
	entry: {
		app: "./src/index.tsx",
	},

	// output: {
	// 	filename: "[name].js",
	// 	path: __dirname + "/build",
	// 	library: {
	// 		name: "GydraLED",
	// 		type: "this",
	// 		export: "default",
	// 	},
	// },
	devtool: "source-map",
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"],
		plugins: [new TsconfigPathsPlugin()],
	},
	module: {
		rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
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
