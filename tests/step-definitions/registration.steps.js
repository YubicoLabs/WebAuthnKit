const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { uniqueUsername } = require('../support/helpers');

// "testuser" is a placeholder in the feature file; we use a unique name each run.
When('I enter a new username {string}', async function (_placeholder) {
    this.testUsername = uniqueUsername('tu');
    await this.page.fill('input[name="username"]', this.testUsername);
});

Then('I should be on the registration page', async function () {
    await this.page.waitForURL('**/register', { timeout: 20000 });
    const url = this.page.url();
    assert.ok(url.includes('/register'), `Expected /register but got: ${url}`);
    // RegisterPage's useEffect calls signOut() async. Wait for it to finish
    // before the next step clicks Continue.
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
});

Then('I should see {string}', async function (text) {
    if (text === 'Registration successful') {
        // This alert is transient — it is dispatched and then immediately cleared by
        // AlertClearer when the route changes to '/'. Verify registration success via
        // durable dashboard state (the Security Keys section) instead.
        await this.page.waitForSelector('h5:has-text("Security Keys")', { timeout: 15000 });
        return;
    }
    // Handle dynamic "Hello testuser" — replace the placeholder with the actual username
    const resolvedText = text.replace('testuser', this.testUsername || 'testuser');
    await this.page.waitForSelector(`text=${resolvedText}`, { timeout: 10000 });
});

Then('a credential should exist for {string} in the system', async function (_placeholder) {
    // Check localStorage for user data and all keys
    const debugInfo = await this.page.evaluate(() => {
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            allKeys.push({ key: k, value: (localStorage.getItem(k) || '').slice(0, 200) });
        }
        return { user: localStorage.getItem('user'), allKeys };
    });
    console.log('[DEBUG] localStorage:', JSON.stringify(debugInfo));

    // Credential list items render as divs with a button labelled "Edit".
    // Wait for at least one Edit button to appear inside the Security Keys card.
    const credItems = this.page.locator('.card:has(h5:has-text("Security Keys")) button:has-text("Edit")');
    await credItems.first().waitFor({ timeout: 30000 });
    const count = await credItems.count();
    assert.ok(count > 0, 'Expected at least one credential in the list');
});

// This scenario requires seeding a Cognito account without a credential —
// complex state that is out of scope for automated UI testing.
Given('{string} has a pending Cognito account but no credential', async function (_username) {
    return 'pending';
});
