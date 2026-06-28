# Chrome Power

![Visualization](pic.png)

---

The first open-source ~~fingerprint browser~~ Chrome multi-instance management tool. Developed based on Puppeteer, Electron, and React.

This software follows the AGPL license, so if you want to modify and publish it, please keep it open source.

For Chromium source code modifications, please refer to [chrome-power-chromium](https://github.com/zmzimpl/chrome-power-chromium)

## Disclaimer

This code is only for technical exchange and learning. Please do not use it for illegal or commercial purposes. This code only promises not to save any user data and takes no responsibility for user data. Please be aware.

## Getting Started

Follow these steps to start using this software:

- Download the installation package [Click here to download](https://github.com/TangNPC/chrome-power-app/releases)
- It is recommended to go to the settings page to set your cache directory.
- Create a proxy
- Create a window
  - Create a blank window
  - Import windows
    - Import from template
    - Import from AdsPower

## Features

- [x] Multi-window management
- [x] Proxy settings
- [x] English and Chinese support
- [x] Puppeteer/Playwright/Selenium integration
- [x] ~~Support cookie import~~
- [x] Mac installation support
- [x] Extension management
- [x] Synchronization operations
- [ ] Automation scripts

## Local Run/Build

Environment: Node v18.18.2, npm 9.8.1

- Install dependencies: `npm i`
- Run debug: `npm run watch`
- (Optional) Build for deployment: `npm run package`. Note: Stop the development environment when building, otherwise the sqlite3 package may fail to build.

## API Documentation

[Postman API](https://documenter.getpostman.com/view/25586363/2sA3BkdZ61#intro)

## FAQ

### How to set the cache directory

On the settings page, click on the cache directory, select your cache directory, and then click OK. Note: Do not set the cache directory on the C drive or in the installation directory, otherwise updates may lead to the loss of the cache directory.

### Windows 10 crashes after installation

If you encounter a crash, try right-clicking the program after installation - Properties, and add `--no-sandbox` or `--in-process-gpu` to the end of the target field, then try starting it again.

### Proxy cannot be used

Currently, only SOCKS5 and HTTP proxies are supported. Please check if the proxy format is correct and if the local proxy has TUN mode and Global mode enabled. Please raise an issue or contact the author after checking.

### Mac auto-arrange cannot be used

Mac auto-arrange requires Accessibility permissions. You can check the running logs. If it prompts missing permissions, please enable them in Settings - Accessibility.
