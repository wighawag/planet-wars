const webpack = require("webpack");
const fs = require("fs");
const path = require("path");
const config = require("sapper/config/webpack.js");
const pkg = require("./package.json");
const dotEnv = require("dotenv-webpack");

const mode = process.env.NODE_ENV;
const dev = mode === "development";

const environments = {
  production: {
    contracts: "./src/contracts/production.json"
  },
  staging: {
    contracts: "./src/contracts/staging.json"
  },
  development: {
    contracts: "./src/contracts/development.json"
  }
};
const contractsPath = process.env.CONTRACTS_PATH || environments[mode].contracts;
let contractsInfo = path.resolve(__dirname, contractsPath);
if (!fs.existsSync(contractsInfo)) {
  console.error(`${mode} contracts info file doesn't exist: ${contractsInfo}`);
  // process.exit();
}
console.log(`using ${contractsInfo} contracts`);

let dotEnvPlugin;
let envPath = ".env";
if (mode) {
  envPath = `./.env.${mode}`;
}
if (fs.existsSync(envPath)) {
  dotEnvPlugin = new dotEnv({
    path: envPath
  });
}

const alias = { svelte: path.resolve("node_modules", "svelte"), contractsInfo };
const extensions = [".mjs", ".js", ".json", ".svelte", ".html"];
const mainFields = ["svelte", "module", "browser", "main"];

module.exports = {
  client: {
    entry: config.client.entry(),
    output: config.client.output(),
    resolve: { alias, extensions, mainFields },
    node: {
      net: "empty",
      fs: "empty",
      tls: "empty",
      dns: "empty"
    },
    module: {
      rules: [
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: "svelte-loader",
            options: {
              dev,
              hydratable: true,
              hotReload: false // pending https://github.com/sveltejs/svelte/issues/2377
            }
          }
        },
        {
          test: /\.(jpg|png)$/,
          use: {
            loader: "url-loader"
          }
        }
      ]
    },
    mode,
    plugins: [
      dotEnvPlugin,
      // pending https://github.com/sveltejs/svelte/issues/2377
      // dev && new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode)
      })
    ].filter(Boolean),
    devtool: dev && "inline-source-map"
  },

  server: {
    entry: config.server.entry(),
    output: config.server.output(),
    target: "node",
    resolve: { alias, extensions, mainFields },
    externals: Object.keys(pkg.dependencies).concat("encoding"),
    module: {
      rules: [
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: "svelte-loader",
            options: {
              css: false,
              generate: "ssr",
              dev
            }
          }
        },
        {
          test: /\.(jpg|png)$/,
          use: {
            loader: "url-loader"
          }
        }
      ]
    },
    mode: process.env.NODE_ENV,
    plugins: [dotEnvPlugin].filter(Boolean),
    performance: {
      hints: false // it doesn't matter if server.js is large
    }
  },

  serviceworker: {
    entry: config.serviceworker.entry(),
    output: config.serviceworker.output(),
    mode: process.env.NODE_ENV
  }
};
