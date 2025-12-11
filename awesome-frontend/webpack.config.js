const { resolve } = require('path');
const argv = require('yargs-parser')(process.argv.slice(2));
const _mode = argv.mode || 'development';
const _mergeConfig = require(`./config/webpack.${_mode}.js`);
const merge = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WebpackBar = require('webpackbar');
const dotenv = require('dotenv');
const { DefinePlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const isProd = _mode === 'production';

const envFile = `.env`;
dotenv.config({ path: envFile });

const webpackBaseConfig = {
  entry: {
    main: resolve('src/main.tsx'),
  },
  mode: _mode,
  devtool: isProd ? 'hidden-source-map' : 'eval-source-map',
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.css'],
    alias: {
      '@components': resolve(__dirname, './src/components'),
      '@contracts': resolve(__dirname, './src/contracts'),
      '@pages': resolve(__dirname, './src/pages'),
      '@config': resolve(__dirname, './src/config'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@layouts': resolve(__dirname, './src/layouts'),
      '@utils': resolve(__dirname, './src/utils'),
      '@assets': resolve(__dirname, './src/assets'),
      '@types': resolve(__dirname, './src/types'),
      '@react-native-async-storage/async-storage': false,
      '@walletconnect/ethereum-provider': false,
      porto: false,
      '@base-org/account': false,
      '@coinbase/wallet-sdk': false,
      '@gemini-wallet/core': false,
      '@metamask/sdk': false,
      '@safe-global/safe-apps-provider': false,
    },
    // ⭐ 关键：让 webpack 对 ESM 不再强制“全限定路径”
    fullySpecified: false,
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
    // ⭐ 重点：把环境变量注入到代码里
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(_mode),
      'process.env.VITE_INFURA_SEPOLIA_URL': JSON.stringify(
        process.env.VITE_INFURA_SEPOLIA_URL || '',
      ),
      'process.env.VITE_PROFILE_API_BASE_URL': JSON.stringify(
        process.env.VITE_PROFILE_API_BASE_URL || '',
      ),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'public', // 源目录
          to: '.',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
};

module.exports = merge.default(webpackBaseConfig, _mergeConfig);
