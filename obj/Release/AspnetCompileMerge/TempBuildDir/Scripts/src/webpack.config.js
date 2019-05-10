const path = require('path');
const argv = require('yargs').argv;

let isDevMode = process.env.NODE_ENV !== 'production';

const LOCAL_ODISS_NPM_PATH = path.resolve(__dirname, 'odiss-npm-symlinks');

// TODO - Create directory odiss-npm-symlinks in __dirname and all the needed windows symlinks that are needed
// (e.g.) mklink /d "E:\Projects\ABC Group\Octacom.Odiss.ABCgroup\Octacom.Odiss.ABCgroup.Web\Scripts\src\odiss-npm-symlinks\odiss-app-grid" "E:\Projects\Octacom.NPM\npm-packages\ui\odiss-app-grid\src"
// Suggestion - Create a bat script to accomplish this automatically for all (or let Webpack do it :))

const LOCAL_ODISS_NPM_ALIASES = {
    'odiss-app-grid': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-app-grid\\index.js'),
    'odiss-document-tab': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-document-tab\\index.js'),
    'odiss-field-renderer': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-field-renderer\\index.js'),
    'odiss-grid': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-grid\\index.js'),
    'odiss-form-validator': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-form-validator\\form-validator.js'),
    'odiss-login': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-login\\index.js'),
    'odiss-login-headless': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-login-headless\\index.js'),
    'odiss5-document-viewer': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss5-document-viewer\\index.js'),
    //'odiss-http-client': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-http-client\\index.js'),
    'bootstrap-confirm': path.resolve(LOCAL_ODISS_NPM_PATH, 'bootstrap-confirm\\bootstrap-confirm.js'),
    'bootstrap-select': path.resolve(LOCAL_ODISS_NPM_PATH, 'bootstrap-select\\bootstrap-select.js'),
    'headless-form-validator': path.resolve(LOCAL_ODISS_NPM_PATH, 'headless-form-validator\\index.js'),
    'odiss-alert-headless': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-alert-headless\\index.js'),
    'routes-with-navigation': path.resolve(LOCAL_ODISS_NPM_PATH, 'routes-with-navigation\\index.js'),
    'array-helper': path.resolve(LOCAL_ODISS_NPM_PATH, 'array-helper\\array.js'),
    'string-helper': path.resolve(LOCAL_ODISS_NPM_PATH, 'string-helper\\string.js'),
    'react-outside-render': path.resolve(LOCAL_ODISS_NPM_PATH, 'react-outside-render\\react-outside-render.js'),
    'odiss-action-resolver': path.resolve(LOCAL_ODISS_NPM_PATH, 'odiss-action-resolver\\action-resolver.js')
};

const LOCAL_ODISS_DEPENDENCY_NPM_ALIASES = {
    'react': path.resolve('./node_modules/react'),
    'react-dom': path.resolve('./node_modules/react-dom'),
    'react-router-dom': path.resolve('./node_modules/react-router-dom'),
    '@fortawesome/react-fontawesome': path.resolve('./node_modules/@fortawesome/react-fontawesome'),
    '@fortawesome/fontawesome-svg-core': path.resolve('./node_modules/@fortawesome/fontawesome-svg-core'),
    '@fortawesome/free-solid-svg-icons': path.resolve('./node_modules/@fortawesome/free-solid-svg-icons'),
    'bootstrap-daterangepicker': path.resolve('./node_modules/bootstrap-daterangepicker'),
    'jquery': path.resolve('./node_modules/jquery'),
    'matcher': path.resolve('./node_modules/matcher'),
    'react-bootstrap': path.resolve('./node_modules/react-bootstrap'),
    'prop-types': path.resolve('./node_modules/prop-types')
}

if (argv.localnpm) {
    console.log('Running project with local NPM packages as aliases, allowing for development of dependencies.');
}

module.exports = {
    mode: isDevMode ? 'development' : 'production',
    entry: {
        datagrid: ['@babel/polyfill', './app/datagrid.js'],
        users: ['@babel/polyfill', './app/users.js'],
        ap: ['@babel/polyfill', './app/ap.js'],
        vendors: ['@babel/polyfill', './app/vendors-entry.js'],
        'invoice-tab': ['@babel/polyfill', './app/invoice-tab.js'],
        'submit-invoice': ['@babel/polyfill', './app/document-tabs/submit-invoice/index.js'],
        'login-page': ['@babel/polyfill', './app/login.js']
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: isDevMode ? "source-map" : false,
    watch: isDevMode,
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                  }
                }
            },
            {
                test: /\.(ts|tsx)?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.scss$/,
                use: [
                    "style-loader", // creates style nodes from JS strings
                    "css-loader", // translates CSS into CommonJS
                    "sass-loader" // compiles Sass to CSS, using Node Sass by default
                ]
            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: ['url-loader']
            }
        ]
    },
    plugins: [
    ],
    resolve: {
        extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
        symlinks: !isDevMode,
        alias: argv.localnpm ? { /*...LOCAL_ODISS_DEPENDENCY_NPM_ALIASES,*/ ...LOCAL_ODISS_NPM_ALIASES } : undefined
    }
};