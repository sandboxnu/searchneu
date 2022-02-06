# Setting up Search NEU

#### Fork the repository

Head over to [Github's registration page](https://github.com/join) and create an account, if you don't already have one. Then, while logged into Github, fork the Search NEU repository by clicking on the fork button in the top right corner of this page. This will copy all of the Search NEU code to your personal github account and let you make any changes you want to. (Later, once you have made some changes, this will also let you easily merge the changes into the main repository.)

### Windows Computers

If you are not on Windows, you can skip this section.

We recommend using [Bash on Windows](https://www.microsoft.com/en-us/p/ubuntu/9nblggh4msv6) to develop on Windows instead of cywin or the built in windows terminal. Head over to the Microsoft store and install it, if you don't already have it installed. After it is installed you can launch it by searching for bash in the start menu. From here on out, you should follow all of the Linux examples (eg. Follow the linux instructions and run `apt-get install nodejs` to install node.js instead of installing the `.exe` for windows instructions file from Node.js's website.)

### Node.js setup

First, you need to download and install Node.js by following the instructions [here](https://nodejs.org/en). This one installation package includes the commands `npm` and `node`, both of which are used later on. If you are using Ubuntu on Windows, follow the instructions [here](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions-enterprise-linux-fedora-and-snap-packages) instead of using the Windows instructions for Node.js.

We recommend that you use yarn to install and manage the npm packages. Yarn is an alternate to the npm client that was developed by Facebook. While not required, we stronlgy recommend everyone to use yarn. Follow the instructions [here](https://yarnpkg.com/lang/en/docs/install/) to install yarn.

## Clone the repository

### Github Desktop

If you are not that familiar with using git from the command line, you can also use the desktop app. You can download that [here](https://desktop.github.com). Once you have it setup, download the searchneu repository you just cloned to your personal Github account. After this, open up the terminal and `cd` to the `searchneu` directory. Then, skip to the section below on installing the dependencies.

### Git command line

If you want to, you can also use the command line to download the repository. Start by cloning the repo with `git clone`.

```bash
git clone git@github.com:<your username>/searchneu.git
```

For instance, if your username was `ryanhugh`, the command would be:

```
git clone git@github.com:ryanhugh/searchneu.git
```

If for some reason git is not installed, run this command to install it.

```
sudo apt install git
```

After you were able to download the repository, `cd` into the repository directory.

```bash
cd searchneu
```

### Installing the dependencies

Almost every Node.js project has a lot of dependencies. These include React, Lodash, Webpack, and usually a bunch of other libraries. Lets install them.

```bash
yarn
```

If you get installation errors, try deleting the `node_modules` folder and running the install command again. If the problem continues, feel free to message us.

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
jest --coverage --watchAll
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
