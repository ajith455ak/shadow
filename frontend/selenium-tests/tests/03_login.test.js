const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver, loadState, saveState, logStepResult } = require('./state');

describe('Step 3: Login Authentication', function () {
  let driver;
  let state;

  before(async function () {
    state = loadState();
    assert.ok(state.email && state.password, "Credentials missing from state. Run earlier steps.");
    driver = await createDriver();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should authenticate the user and capture localStorage session state', async function () {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      console.log(`Logging in with email: ${state.email}...`);
      await driver.get(`${baseUrl}/login`);

      await driver.wait(until.elementLocated(By.css('[data-testid="login-email-input"]')), 10000);
      await driver.findElement(By.css('[data-testid="login-email-input"]')).sendKeys(state.email);
      await driver.findElement(By.css('[data-testid="login-password-input"]')).sendKeys(state.password);
      await driver.findElement(By.css('[data-testid="login-submit-button"]')).click();

      console.log("Waiting for character-creation redirect...");
      await driver.wait(until.urlContains('/character-creation'), 10000);
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/character-creation'), `Failed redirect to character creation. URL: ${currentUrl}`);

      // Retrieve full localStorage content to save session state (auth token)
      console.log("Saving browser localStorage session state...");
      const localStorageData = await driver.executeScript(() => {
        return JSON.stringify(window.localStorage);
      });

      state.localStorageData = localStorageData;
      saveState(state);
      console.log("Login authentication step passed, session state stored.");
      
      logStepResult(3, "Login Page", "test_login_authentication", "PASSED");
    } catch (error) {
      logStepResult(3, "Login Page", "test_login_authentication", "FAILED", error.message || String(error));
      throw error;
    }
  });
});
