const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver, loadState, saveState, logStepResult } = require('./state');

describe('Step 4: Character Creation', function () {
  let driver;
  let state;

  before(async function () {
    state = loadState();
    if (!state || !state.localStorageData) {
      logStepResult(4, "Character Page", "test_character_creation_and_setup", "SKIPPED", "Previous step state missing");
      this.skip();
      return;
    }
    try {
      driver = await createDriver();
    } catch (e) {
      logStepResult(4, "Character Page", "test_character_creation_and_setup", "SKIPPED", String(e));
      this.skip();
      return;
    }
    if (!driver) {
      logStepResult(4, "Character Page", "test_character_creation_and_setup", "SKIPPED", "Driver unavailable");
      this.skip();
    }
  });


  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should restore the session, open character creation, and create a character', async function () {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      // 1. Navigate to domain to allow setting localStorage
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

      // 3. Navigate to character creation page
      console.log("Navigating to character creation page...");
      await driver.get(`${baseUrl}/character-creation`);

      // Fill character details
      await driver.wait(until.elementLocated(By.css('[data-testid="character-name-input"]')), 10000);
      console.log(`Setting character name to: ${state.username}`);
      await driver.findElement(By.css('[data-testid="character-name-input"]')).sendKeys(state.username);
      
      console.log("Selecting class and avatar...");
      await driver.findElement(By.css('[data-testid="class-penetration_tester"]')).click();
      await driver.findElement(By.css('[data-testid="avatar-avatar_2"]')).click();
      
      console.log("Clicking create character button...");
      await driver.findElement(By.css('[data-testid="create-character-button"]')).click();

      // Verify redirect to dashboard
      console.log("Waiting for dashboard redirect...");
      await driver.wait(until.urlContains('/dashboard'), 15000);
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/dashboard'), `Failed redirect to dashboard. URL: ${currentUrl}`);

      // Update localStorage state after character creation
      console.log("Updating localStorage state in state.json...");
      const updatedLocalStorage = await driver.executeScript(() => {
        return JSON.stringify(window.localStorage);
      });

      state.localStorageData = updatedLocalStorage;
      saveState(state);
      console.log("Character creation step passed successfully.");
      
      logStepResult(4, "Character Page", "test_character_creation_and_setup", "PASSED");
    } catch (error) {
      logStepResult(4, "Character Page", "test_character_creation_and_setup", "FAILED", error.message || String(error));
      throw error;
    }
  });
});
