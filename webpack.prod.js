const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const autoprefixer = require('autoprefixer')
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
module.exports = {
    mode: 'production',
    entry: {
        index: './src/index.js'
    },
    output: {
        filename: '[name].[hash].js'
    },
    optimization: {
        minimizer: [
            new OptimizeCssAssetsPlugin(),
            new TerserPlugin()
        ]
    },
    plugins: [
        new BundleAnalyzerPlugin({
            analyzerPort: 80
        }),
        new MiniCssExtractPlugin({ filename: "[name].[hash].css" }),
        new HtmlWebpackPlugin({ template: "./src/index.html" }),
        new CleanWebpackPlugin()
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
                    {
                        loader: 'lit-scss-loader',
                        options: {
                            minify: true
                        },
                    },
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
                    MiniCssExtractPlugin.loader, //2. Extract css into files
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
                            }
                        }
                    }
                ]
            }
        ]
    },
    node: {
        fs: "empty",
        net: 'empty',
        tls: 'empty'
    }
}