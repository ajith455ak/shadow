const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver, loadState, logStepResult } = require('./state');

describe('Step 5: Dashboard Redirection', function () {
  let driver;
  let state;

  before(async function () {
    state = loadState();
    assert.ok(state.localStorageData, "Session data missing from state. Run earlier steps first.");
    driver = await createDriver();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should restore session, view dashboard, and verify initial 100 coins', async function () {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      // 1. Establish domain context
      console.log("Navigating to establish local domain context...");
      await driver.get(`${baseUrl}/login`);

      // 2. Inject stored localStorage
      console.log("Injecting saved localStorage state...");
      await driver.executeScript((dataStr) => {
        const data = JSON.parse(dataStr);
        for (const key in data) {
          window.localStorage.setItem(key, data[key]);
        }
      }, state.localStorageData);

      // 3. Navigate to dashboard
      console.log("Navigating to dashboard...");
      await driver.get(`${baseUrl}/dashboard`);

      console.log("Waiting for dashboard route and coins display...");
      await driver.wait(until.urlContains('/dashboard'), 10000);
      await driver.wait(until.elementLocated(By.css('[data-testid="dashboard-coins"]')), 10000);

      const coinsEl = await driver.findElement(By.css('[data-testid="dashboard-coins"]'));
      const coinsText = await coinsEl.getText();
      console.log("Starting coins on dashboard: " + coinsText);
      
      assert.strictEqual(coinsText.trim(), '100', 'Starting coins should be exactly 100');
      console.log("Dashboard redirection step passed successfully.");
      
      logStepResult(5, "Dashboard Page", "test_dashboard_routes_and_navigation", "PASSED");
    } catch (error) {
      logStepResult(5, "Dashboard Page", "test_dashboard_routes_and_navigation", "FAILED", error.message || String(error));
      throw error;
    }
  });
});
