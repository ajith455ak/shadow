const fs = require('fs');
const path = require('path');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const stateFile = path.join(__dirname, 'state.json');

module.exports = {
  saveState: (data) => {
    fs.writeFileSync(stateFile, JSON.stringify(data, null, 2));
  },
  loadState: () => {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
    return {};
  },
  createDriver: async () => {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,720');

    const chromePath = "C:\\Users\\ajith kumar\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe";
    if (fs.existsSync(chromePath)) {
      options.setBinaryPath(chromePath);
    }

    return await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }
};
