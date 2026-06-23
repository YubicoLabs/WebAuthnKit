const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const {
    captureRecoveryCodes,
    navigateToLogin,
    navigateToLoginWithUsername,
} = require('../support/helpers');

Given('{string} has been issued recovery codes at registration', async function (_placeholder) {
    // After registration the dashboard auto-opens the Recovery Codes modal.
    // captureRecoveryCodes handles both the auto-open and manual-open cases.
    this.recoveryCodes = await captureRecoveryCodes(this.page);
    assert.strictEqual(this.recoveryCodes.length, 5, 'Expected 5 recovery codes after registration');
});

// Navigates to the ForgotStep within /login by clicking "Forgot Your Security Key?"
// In the upstream, recovery codes are entered via the ForgotStep form (not a modal).
// The username is pre-populated from localStorage.
Given('I am on the recovery code sign-in page for {string}', async function (_placeholder) {
    await navigateToLogin(this.page);
    // Ensure username is in localStorage so ForgotStep can pre-fill it
    await this.page.evaluate((username) => {
        localStorage.setItem('username', username);
    }, this.testUsername);
    await this.page.fill('input[name="username"]', this.testUsername);
    await this.page.click('text=Forgot Your Security Key?');
    // Wait for the ForgotStep to render (has a recoveryCode input)
    await this.page.waitForSelector('input[name="recoveryCode"]', { timeout: 10000 });
});

// Consumes recoveryCodes[0] via a complete recovery-code login, records the used code,
// then signs out and returns to the recovery code page so the scenario's When steps start
// from the correct state.
Given('I have already used one recovery code', async function () {
    const codeToUse = this.recoveryCodes[0];
    assert.ok(codeToUse, 'No recovery code available — check Background setup');
    this.usedRecoveryCode = codeToUse;

    // Enter the recovery code and submit
    await this.page.fill('input[name="recoveryCode"]', codeToUse);
    await this.page.click('button:has-text("Continue")');
    await this.page.waitForURL('**/', { timeout: 30000 });

    // Dismiss recovery codes modal if it re-opens after sign-in
    const recoveryModal = await this.page.waitForSelector(
        '.modal-title:has-text("Recovery Codes")',
        { timeout: 5000 }
    ).then(() => true).catch(() => false);
    if (recoveryModal) {
        await this.page.click('.modal-footer button:has-text("Ignore")');
        await this.page.waitForSelector('.modal-title:has-text("Recovery Codes")', {
            state: 'hidden', timeout: 10000,
        });
    }

    // Sign out and navigate back to the recovery code sign-in page
    await this.page.click('button:has-text("Sign Out")');
    await this.page.waitForURL('**/login', { timeout: 10000 }).catch(() => {});
    await navigateToLogin(this.page);
    await this.page.evaluate((username) => {
        localStorage.setItem('username', username);
    }, this.testUsername);
    await this.page.fill('input[name="username"]', this.testUsername);
    await this.page.click('text=Forgot Your Security Key?');
    await this.page.waitForSelector('input[name="recoveryCode"]', { timeout: 10000 });
});

When('I enter a valid recovery code', async function () {
    const code = this.recoveryCodes[0];
    assert.ok(code, 'No recovery code captured — check Background setup');
    await this.page.waitForSelector('input[name="recoveryCode"]', { timeout: 10000 });
    await this.page.fill('input[name="recoveryCode"]', code);
    await this.page.click('button:has-text("Continue")');
});

When('I enter an invalid recovery code {string}', async function (invalidCode) {
    await this.page.waitForSelector('input[name="recoveryCode"]', { timeout: 10000 });
    await this.page.fill('input[name="recoveryCode"]', invalidCode);
    await this.page.click('button:has-text("Continue")');
});

When('I enter the previously used recovery code', async function () {
    assert.ok(this.usedRecoveryCode, 'No used recovery code recorded — check Given step');
    await this.page.waitForSelector('input[name="recoveryCode"]', { timeout: 10000 });
    await this.page.fill('input[name="recoveryCode"]', this.usedRecoveryCode);
    await this.page.click('button:has-text("Continue")');
});

Then('that recovery code should be marked as used', async function () {
    // Wait for the dashboard's getAll() to complete before opening the modal.
    await this.page.waitForSelector('h5:has-text("Security Keys")', { timeout: 15000 });
    await this.page.waitForSelector('.card:has(h5:has-text("Security Keys")) button:has-text("Edit")', { timeout: 30000 });
    await this.page.waitForTimeout(1000);

    await this.page.click('button:has-text("Recovery Codes")');
    await this.page.waitForSelector('.modal-title:has-text("Recovery Codes")', { timeout: 10000 });
    // After using 1 of 5 codes, 4 should remain. The listRecoveryCodes Lambda may cold-start.
    await this.page.waitForSelector('text=/\\d+ Recovery Codes? remaining/', { timeout: 45000 });
    const countText = await this.page.locator('text=/\\d+ Recovery Codes? remaining/').textContent();
    const count = parseInt(countText.match(/(\d+)/)[1], 10);
    assert.ok(count < 5, `Expected fewer than 5 codes remaining but found ${count}`);
    await this.page.click('.modal-footer button:has-text("Ignore")');
});
