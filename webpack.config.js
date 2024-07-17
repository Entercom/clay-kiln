const path = require('path'),
  MiniCssExtractPlugin = require('mini-css-extract-plugin'),
  webpack = require('webpack'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  { CleanWebpackPlugin } = require('clean-webpack-plugin'),
  LodashModuleReplacementPlugin = require('lodash-webpack-plugin'),
  CssMinimizerPlugin = require('css-minimizer-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin'),
    { VueLoaderPlugin } = require('vue-loader'),
  prod = process.argv.indexOf('production') !== -1,
  kilnVersion = require('./package.json').version;

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
    filename: 'dist/clay-kiln-[name].css'
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
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.LOG': '"trace"'
  }),
  new CleanWebpackPlugin(),
  new HtmlWebpackPlugin({
    template: './src/index.html'
  }),
  new MyCompilationPlugin(),
  new webpack.optimize.ModuleConcatenationPlugin(),
  new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/)
];

if (prod) {
  plugins.push(new webpack.DefinePlugin({
    'process.env.NODE_ENV': '"production"'
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
    path: path.resolve(__dirname, 'dist'),
    filename: 'dist/clay-kiln-[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use:{
          loader: 'babel-loader',
          options:{
            presets:['@babel/preset-env']
          }
        }
      },
      {
        test: /\.scss$|\.css$/,
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
        loader: 'html-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          esModule: false,
          extractCSS: true,
          loaders: {
            css: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
            sass: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader?data=@import "styleguide/keen-variables.scss";'],
            scss: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader?data=@import "styleguide/keen-variables.scss";']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true,
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
      keen: path.resolve(__dirname, 'node_modules/keen-ui/src')
    },
    fallback: {
      path: require.resolve('path-browserify')  // Add this line
    }
  }
};
