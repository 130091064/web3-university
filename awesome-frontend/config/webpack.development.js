const HtmlWebpackPlugin = require("html-webpack-plugin");
const FriendlyErrorsWebpackPlugin = require("@soda/friendly-errors-webpack-plugin");
const notifier = require("node-notifier");
const { join, resolve } = require("path");
const port = 3000;

module.exports = {
	stats: "errors-only",
	output: {
		path: join(__dirname, "../dist"),
		publicPath: "/",
		//如果是通过loader 编译的 放到scripts文件夹里 filename
		filename: "scripts/[name].bundle.js",
		//如果是通过'asset/resource' 编译的
		assetModuleFilename: "images/[name].[ext]",
	},
	devServer: {
		historyApiFallback: true,
		static: {
			directory: join(__dirname, "../dist"),
		},
		port,
		hot: true,
		compress: true,
		client: {
			logging: "none", // 禁用客户端日志
			overlay: {
				errors: true,
				warnings: false,
			},
		},
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: "index.html",
			favicon: "./public/logo.png",
			template: resolve(__dirname, "../src/index-dev.html"),
		}),
		new FriendlyErrorsWebpackPlugin({
			compilationSuccessInfo: {
				messages: ["You application is running here http://localhost:" + port],
				notes: ["💊 构建信息请及时关注窗口右上角"],
			},
			// new WebpackBuildNotifierPlugin({
			//   title: '💿 Solv Dvelopment Notification',
			//   logo,
			//   suppressSuccess: true,
			// }),
			onErrors: (severity, errors) => {
				if (severity !== "error") {
					return;
				}
				const error = errors[0];
				console.log(error);
				notifier.notify({
					title: "👒 Webpack Build Error",
					message: severity + ": " + error.name,
					subtitle: error.file || "",
					icon: join(__dirname, "icon.png"),
				});
			},
			clearConsole: true,
		}),
	],
};
