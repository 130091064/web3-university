const { resolve } = require('path');
const argv = require('yargs-parser')(process.argv.slice(2));
const _mode = argv.mode || 'development';
const _mergeConfig = require(`./config/webpack.${_mode}.js`);
const merge = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WebpackBar = require('webpackbar');

const isProd = _mode === 'production';

const webpackBaseConfig = {
  entry: {
    main: resolve('src/main.tsx'),
  },
  mode: _mode,
  devtool: isProd ? 'source-map' : 'eval-source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.css'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'swc-loader',
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb 以下内联
          },
        },
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          // 'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: isProd ? 'styles/[name].[contenthash:5].css' : 'styles/[name].css',
      chunkFilename: isProd ? 'styles/[name].[contenthash:5].css' : 'styles/[name].css',
      ignoreOrder: false,
    }),
    new WebpackBar({
      name: 'Building',
      color: '#4f46e5',
    }),
  ],
};

module.exports = merge.default(webpackBaseConfig, _mergeConfig);
