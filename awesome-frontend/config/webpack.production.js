const { join, resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = {
  stats: 'none',
  output: {
    path: join(__dirname, '../dist'),
    publicPath: '/',
    filename: 'scripts/[name].[contenthash:5].bundle.js',
    assetModuleFilename: 'images/[name].[contenthash:5][ext]',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Awesome Frontend',
      filename: 'index.html',
      template: resolve(__dirname, '../src/index-prod.html'),
      favicon: './public/logo.png',
    }),
    // ✅ 注入 NODE_ENV 用于条件编译
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ],
  optimization: {
    minimize: true,
    // ✅ Tree Shaking: 标记未使用的导出
    usedExports: true,
    // ✅ 生产环境副作用优化
    sideEffects: true,
    //css + js 多线程压缩 加快编译速度
    minimizer: [
      new CssMinimizerPlugin({
        parallel: true,
      }),
      new TerserPlugin({
        parallel: true,
        // ✅ 生产环境移除 console
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
          },
        },
      }),
    ],
    // ✅ 优化 splitChunks: 细粒度分包策略
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        // 第三方库单独打包
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Web3 相关库单独打包（体积大）
        web3: {
          test: /[\\/]node_modules[\\/](viem|wagmi|@tanstack)[\\/]/,
          name: 'web3-libs',
          priority: 20,
          reuseExistingChunk: true,
        },
        // 公共组件代码
        commons: {
          test: /[\\/]src[\\/](components|hooks|utils)[\\/]/,
          name: 'commons',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        // CSS 单独打包
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
          priority: 30,
        },
      },
    },
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-dom/client': 'ReactDOM',
    '@remix-run/router': 'RemixRouter',
    'react-router': 'ReactRouter',
    'react-router-dom': 'ReactRouterDOM',
  },
};
