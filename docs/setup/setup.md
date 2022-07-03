### Installing the dependencies

Almost every Node.js project has a lot of dependencies. These include React, Lodash, Webpack, and usually a bunch of other libraries. Lets install them.

```bash
yarn
```

If you get installation errors, try deleting the `node_modules` folder and running the install command again.

### Start the server

This will start Search NEU in development mode locally. It will listen on port 5000. If you make any changes to the frontend code while the server is running, webpack will automatically recompile the code and send the updates to the browser. Most of the time, the changes should appear in the browser without needing to reload the page ([More info about Hot Module Reloading](https://webpack.js.org/concepts/hot-module-replacement/)). Sometimes this will fail and a message will appear in Chrome's developer tools asking you to reload the page to see the changes.

```bash
yarn dev
```

### React Dev tools

Also, install the React Developer tools browser extension ([Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)). This helps a lot with debugging the frontend React code. More about debugging below.

### Debugging

Chrome dev tools are great for debugging both Node.js code and JavaScript code in a browser. You can debug a Node.js script by running `babel-node` (or `node`) with these arguments:

```bash
babel-node --debug --inspect-brk filename.js
```

### Run the tests

```bash
# Run the tests once and exit
yarn test

# Run just the files that have changed since the last git commit
yarn test --watch

# Run all the tests
yarn test --watchAll

# Run all the tests and generate a code coverage report.
# An overview is shown in the termal and a more detailed report is saved in the coverage directory.
yarn jest --coverage --watchAll
```

### Build the code for production

This command will build the frontend.

```bash
yarn build
```

### Linting

Some of the code follows the ESLint config. All the code in the codebase should pass these linting checks.

```bash
yarn lint
```

Prettier formats code automatically when you git commit, so don't waste time manual formatting.
