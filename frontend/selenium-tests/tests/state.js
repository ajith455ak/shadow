const fs = require('fs');
const path = require('path');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const stateFile = path.join(__dirname, 'state.json');
const reportFile = path.join(__dirname, '../../../selenium_js_report.json');

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
    try {
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
    } catch (e) {
      console.warn("Chrome webdriver initialization warning:", e.message);
      return null;
    }
  },

  logStepResult: (stepId, category, name, status, errorMsg = "None") => {
    let report = [];
    if (fs.existsSync(reportFile)) {
      try {
        report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      } catch (e) {
        report = [];
      }
    }
    // Remove if already exists
    report = report.filter(item => item.id !== stepId);
    report.push({
      id: stepId,
      category: category,
      name: name,
      status: status,
      error: errorMsg
    });
    // Sort by id
    report.sort((a, b) => a.id - b.id);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  }
};
