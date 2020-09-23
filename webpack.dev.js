const HtmlWebpackPlugin = require("html-webpack-plugin");
const autoprefixer = require('autoprefixer');
module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.js'
    },
    output: {
        filename: '[name].[hash].js',
        publicPath: '/',
    },
    plugins: [
        new HtmlWebpackPlugin({ template: "./src/index.html" })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.(png|jpe?g|gif)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: 'assets'
                }
            },
            {
                test: /\.lit\.(scss|css)$/,
                use: [
                    "lit-scss-loader",
                    "extract-loader",
                    "css-loader",
                    { 
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [autoprefixer()]
                        }
                    },
                    { 
                        loader: 'sass-loader',
                        options: {
                            webpackImporter: false,
                            sassOptions: {
                                includePaths: ['node_modules'],
                            }
                        }
                    }
                ]
            },
            {
                test: /^(?!.*\..*\.(?:scss|css)$).*\.(?:scss|css)$/,
                use: [
                    "style-loader", //2. Inject styles into DOM
                    "css-loader", //1. Turns css into commonjs
                    { 
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [autoprefixer()]
                        }
                    },
                    { 
                        loader: 'sass-loader',
                        options: {
                            webpackImporter: false,
                            sassOptions: {
                                includePaths: ['node_modules'],
                            },
                        }
                    },
                ]
            }
      ]
    },
    devServer: {
        historyApiFallback: true,
        port: 80
    },
    node: {
        fs: "empty",
        net: 'empty',
        tls: 'empty'
    }
}