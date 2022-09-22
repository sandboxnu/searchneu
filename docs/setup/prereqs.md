# Prerequisites/Dependencies

This setup guide tries its best not to assume people have background knowledge, and provides basic setup instructions.

### Terminal

To work on this project, you\'ll need a UNIX-based terminal. Mac/Linux users already have this. Windows users should install WSL, the Windows Subsystem for Linux.

[WSL installation instructions](https://docs.microsoft.com/en-us/windows/wsl/install). Also make sure to [upgrade to version 2](https://docs.microsoft.com/en-us/windows/wsl/install#upgrade-version-from-wsl-1-to-wsl-2).

?> **Tip:** We recommend installing [Windows Terminal](https://docs.microsoft.com/en-us/windows/terminal/install) for a better development experience than the Command Prompt.

### Fast Node Manager (fnm)

- Install [FNM](https://github.com/Schniz/fnm) - this helps manage Node versions
  - Don't install anything else yet - we'll do that in a bit

### Source code

- Clone the repo: `git clone https://github.com/sandboxnu/searchneu`
- Change into the repo directory: `cd ./searchneu`
- Switch Node versions: `fnm use`
  - There is a file called `.nvmrc` in the repository, which tells `fnm` which version to use

### Yarn

- `yarn` is our package manager of choice - we use it to manage all of the dependencies we are using for this project.
- Run `npm i -g yarn`
  - If you ever switch Node versions, you'll have to reinstall this (see this [issue](https://github.com/Schniz/fnm/issues/109))
