const { join, resolve } = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	stats: "none",
	output: {
		path: join(__dirname, "../dist"),
		publicPath: "/",
		filename: "scripts/[name].[contenthash:5].bundle.js",
		assetModuleFilename: "images/[name].[contenthash:5][ext]",
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: "Awesome Frontend",
			filename: "index.html",
			template: resolve(__dirname, "../src/index-prod.html"),
			favicon: "./public/logo.png",
		}),
	],
	optimization: {
		minimize: true,
		//css + js 多线程压缩 加快编译速度
		//电脑本身就比较慢 反而更慢
		minimizer: [
			new CssMinimizerPlugin({
				parallel: true,
			}),
			new TerserPlugin({
				parallel: true,
			}),
		],
		splitChunks: { chunks: "all" },
	},
	externals: {
		react: "React",
		"react-dom": "ReactDOM",
		"react-dom/client": "ReactDOM",
		"@remix-run/router": "RemixRouter",
		"react-router": "ReactRouter",
		"react-router-dom": "ReactRouterDOM",
	},
};
