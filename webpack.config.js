const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');

const prod = process.argv.indexOf('production') !== -1;
const kilnVersion = require('./package.json').version;

class MyCompilationPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('MyCompilationPlugin', (compilation) => {
      compilation.hooks.optimize.tap('MyCompilationPlugin', () => {
        console.log('Optimizations are happening now!');
      });
    });
  }
}

const plugins = [
  new MiniCssExtractPlugin({
    filename: 'clay-kiln-[name].css',
    ignoreOrder: true
  }),
  new VueLoaderPlugin(),
  new LodashModuleReplacementPlugin({
    shorthands: true,
    cloning: true,
    caching: true,
    collections: true,
    deburring: true,
    unicode: true,
    memoizing: true,
    coercions: true,
    flattening: true,
    paths: true
  }),
  new webpack.DefinePlugin({
    'process.env.KILN_VERSION': JSON.stringify(kilnVersion),
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'production'
    ),
    'process.env.LOG': '"trace"'
  }),
  new CleanWebpackPlugin(),
  new NodePolyfillPlugin(),
  new HtmlWebpackPlugin(),
  new MyCompilationPlugin(),
  new webpack.optimize.ModuleConcatenationPlugin(),
  new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
  new webpack.IgnorePlugin({
    checkResource(resource) {
      return /LICENSE$/.test(resource) || /\.md$/.test(resource) || /\.info$/.test(resource);
    }
  })
];

if (prod) {
  plugins.push(new webpack.DefinePlugin({
    'process.env.NODE_ENV': '"production"'
  }));
  plugins.push(new TerserPlugin({
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }));
  plugins.push(new CssMinimizerPlugin({
    minimizerOptions: {
      preset: [
        'default',
        {
          discardComments: { removeAll: true }
        }
      ]
    }
  }));
}

module.exports = {
  target: 'web',
  node: {
    __filename: true,
    __dirname: true
  },
  entry: {
    edit: './edit.js',
    view: './view.js',
    'view-public': './view-public.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'clay-kiln-[name].js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          extractCSS: true, // Extract CSS in vue files
          loaders: {
            css: [
              MiniCssExtractPlugin.loader,
              'css-loader',
              'postcss-loader',
              'sass-loader'
            ],
            scss: [
              MiniCssExtractPlugin.loader,
              'css-loader',
              'postcss-loader',
              'sass-loader?data=@import "styleguide/keen-variables.scss";'
            ],
            sass: [
              MiniCssExtractPlugin.loader,
              'css-loader',
              'postcss-loader',
              'sass-loader?data=@import "styleguide/keen-variables.scss";'
            ]
          }
        }
      },
      {
        test: /\.pug$/,
        loader: 'pug-plain-loader'
      },
      {
        test: /\.js$|jsx/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.svg$/,
        use: 'raw-loader'
      },
      {
        test: /\.html$/,
        use: [{
          loader: 'html-loader',
          options: {
            minimize: true
          }
        }]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    },
    minimize: prod,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true
          }
        }
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true }
            }
          ]
        }
      })
    ]
  },
  plugins,
  resolve: {
    extensions: ['.js', '.json', '.vue'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      keen: path.resolve(__dirname, 'node_modules/keen-ui/src')
    },
    fallback: {
      path: require.resolve('path-browserify'),
      domain: require.resolve('domain-browser'),
      console: require.resolve('console-browserify'),
      fs: false,
      zlib: false,
      http: false,
      https: false,
      net: false,
      tls: false,
      child_process: false,
      readline: false,
      stream: false,
      util: false,
      async_hooks: false,
      worker_threads: false,
      module: false,
      os: false
    }
  }
};
