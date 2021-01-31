const path = require('path')

module.exports = {
  devtool: 'eval-source-map',
  mode: 'development',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        include: [path.resolve(__dirname, 'src')],
      }
    ],
  },
  output: {
    publicPath: 'public',
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devServer: {
    publicPath: "/",
    contentBase: "./public",
    hot: true
  }
}
