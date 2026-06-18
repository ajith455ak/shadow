const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const { createDriver, loadState } = require('./state');

describe('Step 2: Email OTP Verification', function () {
  let driver;
  let state;

  before(async function () {
    state = loadState();
    assert.ok(state.email, "Email missing from state. Run step 1 first.");
    driver = await createDriver();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should verify the email using demo OTP token', async function () {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    console.log(`Navigating to verification page for ${state.email}...`);
    // Pass the email in the query parameter to prefill, or enter it manually
    await driver.get(`${baseUrl}/verify-email?email=${encodeURIComponent(state.email)}`);
    
    await driver.wait(until.elementLocated(By.css('[data-testid="verify-email-input"]')), 10000);
    const emailInput = await driver.findElement(By.css('[data-testid="verify-email-input"]'));
    const currentVal = await emailInput.getAttribute('value');
    if (currentVal !== state.email) {
      await emailInput.clear();
      await emailInput.sendKeys(state.email);
    }

    console.log("Requesting verification token resend to extract OTP...");
    await driver.findElement(By.css('[data-testid="resend-token-button"]')).click();
    await driver.sleep(2500); // Wait for OTP text rendering

    console.log("Extracting OTP code from page body...");
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    const otpMatch = bodyText.match(/\(Demo:\s*(\d+)\)/);
    assert.ok(otpMatch, 'Demo OTP code not found in screen text');
    const otp = otpMatch[1];
    console.log(`Extracted OTP: ${otp}`);

    await driver.findElement(By.css('[data-testid="verify-token-input"]')).sendKeys(otp);
    console.log("Submitting OTP verification...");
    await driver.findElement(By.css('[data-testid="verify-submit-button"]')).click();

    console.log("Waiting for login redirect...");
    await driver.wait(until.urlContains('/login'), 10000);
    const currentUrl = await driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/login'), `Failed redirect to login. Current URL: ${currentUrl}`);
    console.log("Email OTP verification step passed successfully.");
  });
});
