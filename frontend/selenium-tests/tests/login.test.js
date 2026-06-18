const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const fs = require('fs');

describe('Login Test', function () {
  let driver;

  before(async function () {
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

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should register a fresh user, verify email, and log in successfully', async function () {
    const rand = Math.floor(Math.random() * 1000000);
    const username = `sel_js_${rand}`;
    const email = `sel_js_${rand}@nexus.io`;
    const password = 'SecurePassword123!';

    // 1. Navigate to Register
    console.log("Navigating to registration screen...");
    await driver.get('http://localhost:8081/register');
    
    // Fill Registration
    await driver.wait(until.elementLocated(By.css('[data-testid="register-username-input"]')), 10000);
    await driver.findElement(By.css('[data-testid="register-username-input"]')).sendKeys(username);
    await driver.findElement(By.css('[data-testid="register-email-input"]')).sendKeys(email);
    await driver.findElement(By.css('[data-testid="register-password-input"]')).sendKeys(password);
    await driver.findElement(By.css('[data-testid="register-confirm-input"]')).sendKeys(password);
    
    console.log("Submitting registration form...");
    await driver.findElement(By.css('[data-testid="register-submit-button"]')).click();

    // 2. Extract Demo OTP and Verify
    console.log("Waiting for verify-email screen...");
    await driver.wait(until.urlContains('/verify-email'), 10000);
    await driver.findElement(By.css('[data-testid="resend-token-button"]')).click();
    await driver.sleep(2000); // Wait for OTP text rendering
    
    console.log("Extracting OTP code...");
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    const otpMatch = bodyText.match(/\(Demo:\s*(\d+)\)/);
    assert.ok(otpMatch, 'Demo OTP code not found in screen');
    const otp = otpMatch[1];
    console.log("Extracted OTP: " + otp);
    
    await driver.findElement(By.css('[data-testid="verify-token-input"]')).sendKeys(otp);
    await driver.findElement(By.css('[data-testid="verify-submit-button"]')).click();

    // 3. Login
    console.log("Waiting for login redirect...");
    await driver.wait(until.urlContains('/login'), 10000);
    await driver.wait(until.elementLocated(By.css('[data-testid="login-email-input"]')), 10000);
    await driver.findElement(By.css('[data-testid="login-email-input"]')).sendKeys(email);
    await driver.findElement(By.css('[data-testid="login-password-input"]')).sendKeys(password);
    await driver.findElement(By.css('[data-testid="login-submit-button"]')).click();

    // 4. Character Creation
    console.log("Waiting for character-creation redirect...");
    await driver.wait(until.urlContains('/character-creation'), 10000);
    await driver.wait(until.elementLocated(By.css('[data-testid="character-name-input"]')), 10000);
    await driver.findElement(By.css('[data-testid="character-name-input"]')).sendKeys(username);
    await driver.findElement(By.css('[data-testid="class-penetration_tester"]')).click();
    await driver.findElement(By.css('[data-testid="avatar-avatar_2"]')).click();
    await driver.findElement(By.css('[data-testid="create-character-button"]')).click();

    // 5. Dashboard Redirect
    console.log("Waiting for dashboard redirect...");
    await driver.wait(until.urlContains('/dashboard'), 10000);
    await driver.wait(until.elementLocated(By.css('[data-testid="dashboard-coins"]')), 10000);
    const coinsEl = await driver.findElement(By.css('[data-testid="dashboard-coins"]'));
    const coinsText = await coinsEl.getText();
    console.log("Starting coins on dashboard: " + coinsText);
    assert.strictEqual(coinsText.trim(), '100', 'Starting coins should be 100');
    console.log("Test successfully completed! Character successfully logged in.");
  });
});
