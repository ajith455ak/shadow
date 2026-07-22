const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver, saveState, logStepResult } = require('./state');

describe('Step 1: Registration', function () {
  let driver;

  before(async function () {
    try {
      driver = await createDriver();
    } catch (e) {
      logStepResult(1, "Register Page", "test_registration_form_submission", "SKIPPED", String(e));
      this.skip();
      return;
    }
    if (!driver) {
      logStepResult(1, "Register Page", "test_registration_form_submission", "SKIPPED", "Driver unavailable");
      this.skip();
    }
  });


  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should register a fresh user and save credentials', async function () {
    try {
      const rand = Math.floor(Math.random() * 1000000);
      const username = `sel_js_${rand}`;
      const email = `sel_js_${rand}@nexus.io`;
      const password = 'SecurePassword123!';

      // Save registration credentials to state
      saveState({ username, email, password });

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      console.log(`Registering user: ${username} (${email})...`);
      await driver.get(`${baseUrl}/register`);
      
      // Fill Registration
      await driver.wait(until.elementLocated(By.css('[data-testid="register-username-input"]')), 10000);
      await driver.findElement(By.css('[data-testid="register-username-input"]')).sendKeys(username);
      await driver.findElement(By.css('[data-testid="register-email-input"]')).sendKeys(email);
      await driver.findElement(By.css('[data-testid="register-password-input"]')).sendKeys(password);
      await driver.findElement(By.css('[data-testid="register-confirm-input"]')).sendKeys(password);
      
      console.log("Submitting registration form...");
      await driver.findElement(By.css('[data-testid="register-submit-button"]')).click();

      // Verify redirect to verify-email
      console.log("Waiting for verify-email screen redirect...");
      await driver.wait(until.urlContains('/verify-email'), 10000);
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/verify-email'), `Failed redirect to verify-email. Current URL: ${currentUrl}`);
      console.log("Registration step passed and credentials saved successfully.");
      
      logStepResult(1, "Register Page", "test_registration_form_submission", "PASSED");
    } catch (error) {
      logStepResult(1, "Register Page", "test_registration_form_submission", "FAILED", error.message || String(error));
      throw error;
    }
  });
});
