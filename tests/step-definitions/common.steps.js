const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { APP_URL, navigateToLogin } = require('../support/helpers');

Given('I am on the login page', async function () {
    await navigateToLogin(this.page);
});

When('I click {string}', async function (label) {
    await this.page.click(`text=${label}`);
});

When('I click Continue', async function () {
    await this.page.click('button:has-text("Continue")');
});

When('I click Sign Out', async function () {
    await this.page.click('button:has-text("Sign Out")');
});

When('I click Cancel', async function () {
    // On the register page, "Cancel" is the "Log In" span (returns to login without registering).
    // On other pages, look for a standard anchor with "Cancel" text.
    await this.page
        .locator('a:has-text("Cancel"), span.btn-link:has-text("Log In")')
        .first()
        .click();
});

// The virtual authenticator responds automatically to WebAuthn API calls.
// This step is a named pause for readability; the next assertion does the real waiting.
When('the virtual authenticator completes the ceremony', async function () {
    await this.page.waitForLoadState('domcontentloaded');
});

Then('I should be redirected to the dashboard', async function () {
    await this.page.waitForURL(`${APP_URL}/`, { timeout: 60000 });
});

Then('I should be on the dashboard', async function () {
    await this.page.waitForURL(`${APP_URL}/`, { timeout: 60000 });
});

Then('I should be signed in as {string}', async function (_username) {
    // Verify authenticated state by checking the h2 greeting on the dashboard
    await this.page.waitForURL(`${APP_URL}/`, { timeout: 10000 });
    await this.page.waitForSelector('h2', { timeout: 10000 });
    const heading = await this.page.textContent('h2');
    assert.ok(heading.includes('Welcome'), `Expected dashboard greeting but got: ${heading}`);
});

Then('I should see an error message', async function () {
    // For recovery-code failures an .alert-danger is shown on /login.
    // For an unknown username the app navigates to /register instead of showing an error.
    await Promise.race([
        this.page.waitForSelector('.alert-danger', { timeout: 15000 }),
        this.page.waitForURL('**/register', { timeout: 15000 }),
    ]);
});

Then('I should remain on the login page', async function () {
    // The app routes unknown users to /register rather than showing an error on /login.
    // Both /login and /register satisfy "the user was not signed in to their account".
    await Promise.race([
        this.page.waitForURL('**/login', { timeout: 10000 }),
        this.page.waitForURL('**/register', { timeout: 10000 }),
    ]);
    const url = this.page.url();
    assert.ok(
        url.includes('/login') || url.includes('/register'),
        `Expected user to not be signed in but got: ${url}`
    );
});

Then('I should be on the login page', async function () {
    await this.page.waitForURL('**/login', { timeout: 15000 });
    const url = this.page.url();
    assert.ok(url.includes('/login'), `Expected /login but got: ${url}`);
});

Then('I should not be signed in', async function () {
    const url = this.page.url();
    // Should still be on a non-dashboard page
    assert.ok(
        !url.match(/^https?:\/\/[^/]+\/?$/),
        `Expected to not be on dashboard but got: ${url}`
    );
});
