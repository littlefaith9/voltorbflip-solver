import * as webpack from 'webpack';

const config: webpack.Configuration = {
	mode: 'production',
	entry: './src/index.ts',
	devtool: 'source-map',
	resolve: {
		extensions: ['.ts'],
	},
	output: {
		path: __dirname,
		filename: 'bundle.js',
	},
	module: {
		rules: [
			{ test: /\.ts$/, use: 'ts-loader' },
		],
	},
};

export default config;