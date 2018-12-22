const path = require('path')

module.exports = {
  devtool: 'eval-source-map',
  entry:  path.resolve(__dirname, './src/index.js'),
  output: {
    libraryTarget: 'umd',
    umdNamedDefine: true,
    path: path.resolve(__dirname, './dist'),
    filename: "epdf-view.min.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  node: {
    fs: 'empty',
    electron: 'empty'
  },
  externals: [
    (function () {
      var IGNORES = [
        'electron'
      ];
      return function (context, request, callback) {
        if (IGNORES.indexOf(request) >= 0) {
          return callback(null, "require('" + request + "')");
        }
        return callback();
      };
    })()
  ]
}
