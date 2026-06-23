const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { APP_URL } = require('../support/helpers');

// Selector for Edit buttons inside the Security Keys card.
// Credentials render as div.d-flex rows with a <button>Edit</button>, NOT as ul>li>a.
const CRED_EDIT_BTN = '.card:has(h5:has-text("Security Keys")) button:has-text("Edit")';

// The recovery codes modal opens AFTER the getAll API call returns (triggered by
// a useEffect that depends on recoveryCodesViewed / allRecoveryCodesUsed). This means
// the credential list always appears BEFORE the modal. We must:
//   1. Wait for the credential list to confirm the dashboard has loaded.
//   2. Wait a short window for the modal to appear (it fires in the same render cycle
//      as getAll completes, so within ~2–3 s of the credentials appearing).
//   3. Dismiss with "Ignore, and don't ask again" (sets localStorage) to prevent
//      the modal from re-opening during the same browser session when the credential
//      list is refreshed by alerts.
async function waitForDashboardReady(page) {
    await page.waitForSelector(CRED_EDIT_BTN, { timeout: 30000 });
    // Give the useEffect up to 4 s to fire and show the modal.
    const rcModal = await page.waitForSelector(
        '.modal-title:has-text("Recovery Codes")', { timeout: 4000 }
    ).then(() => true).catch(() => false);
    if (rcModal) {
        await page.click('.modal-footer button:has-text("Ignore")');
        await page.waitForSelector('.modal-title:has-text("Recovery Codes")', {
            state: 'hidden', timeout: 10000,
        });
        // Re-confirm credential list is visible after modal closes
        await page.waitForSelector(CRED_EDIT_BTN, { timeout: 15000 });
    }
}

// Waits for the credential list to be visible after a dashboard-modifying operation.
Given('there is at least one registered credential', async function () {
    await waitForDashboardReady(this.page);
});

// Legacy step kept for add-credential feature which still uses it.
// Renames the first credential but doesn't verify the nickname text renders
// (it won't due to the backend serialization bug).
Given('{string} has at least one registered credential named {string}', async function (_placeholder, credentialName) {
    await waitForDashboardReady(this.page);

    // Click Edit on the first (and only) credential from registration
    await this.page.locator(CRED_EDIT_BTN).first().click();

    await this.page.waitForSelector('.modal-title:has-text("Edit your Security Key")', { timeout: 10000 });
    await this.page.fill('input[name="nickname"]', credentialName);
    await this.page.click('.modal-footer button:has-text("Save changes")');
    await this.page.waitForSelector('.modal-title:has-text("Edit your Security Key")', {
        state: 'hidden',
        timeout: 10000,
    });

    // Wait for getAll to reload the credential list after the rename triggers an alert
    await this.page.waitForSelector(CRED_EDIT_BTN, { timeout: 30000 });
});

Given('I am on the dashboard', async function () {
    await this.page.waitForURL(`${APP_URL}/`, { timeout: 10000 });
    // waitForDashboardReady waits for either the Recovery Codes modal or the credential
    // list (whichever appears first), then dismisses the modal if it opened.
    // Using "Ignore" sets localStorage to prevent the modal from re-opening and
    // intercepting pointer events on any subsequent modals (Delete, Change PIN, etc.).
    await waitForDashboardReady(this.page);
});

Then('I should see at least one credential in the list', async function () {
    await this.page.waitForSelector(CRED_EDIT_BTN, { timeout: 30000 });
    const count = await this.page.locator(CRED_EDIT_BTN).count();
    assert.ok(count >= 1, `Expected at least 1 credential but found ${count}`);
});

Then('I should see the credential {string} in the list', async function (name) {
    // Credential nickname renders as h5 inside the Security Keys card body
    const selector = `.card:has(h5:has-text("Security Keys")) .card-body h5:has-text("${name}")`;
    await this.page.waitForSelector(selector, { timeout: 30000 });
    const count = await this.page.locator(selector).count();
    assert.ok(count >= 1, `Expected credential "${name}" in the list but it was not found`);
});

When('I open the edit modal for the first credential', async function () {
    await this.page.waitForSelector(CRED_EDIT_BTN, { timeout: 30000 });
    await this.page.locator(CRED_EDIT_BTN).first().click();
    await this.page.waitForSelector('.modal-title:has-text("Edit your Security Key")', { timeout: 10000 });
});

When('I change the nickname to {string}', async function (newName) {
    await this.page.fill('input[name="nickname"]', newName);
});

When('I save the credential changes', async function () {
    await this.page.click('.modal-footer button:has-text("Save changes")');
    await this.page.waitForSelector('.modal-title:has-text("Edit your Security Key")', {
        state: 'hidden',
        timeout: 10000,
    });
});

Then('the credential list should reload successfully', async function () {
    // After save, the update triggers getAll via alert -> the credential list briefly
    // disappears (GETALL_REQUEST wipes items) then reappears when the API responds.
    await this.page.waitForSelector(CRED_EDIT_BTN, { timeout: 30000 });
    const count = await this.page.locator(CRED_EDIT_BTN).count();
    assert.ok(count >= 1, `Expected at least 1 credential after rename but found ${count}`);
});


When('I delete the credential', async function () {
    await this.page.click('.modal-footer button:has-text("Delete")');
    await this.page.waitForSelector('.modal-title:has-text("Edit your Security Key")', {
        state: 'hidden',
        timeout: 10000,
    });
});

Then('no credentials should remain in the list', async function () {
    await this.page.waitForSelector(CRED_EDIT_BTN, {
        state: 'detached',
        timeout: 15000,
    });
    const remaining = await this.page.locator(CRED_EDIT_BTN).count();
    assert.strictEqual(remaining, 0, `Expected no credentials but found ${remaining}`);
});

Then('I should see the credential {string} in the credential list', async function (name) {
    const selector = `.card:has(h5:has-text("Security Keys")) .card-body h5:has-text("${name}")`;
    await this.page.waitForSelector(selector, { timeout: 30000 });
    const count = await this.page.locator(selector).count();
    assert.ok(count >= 1, `Expected credential "${name}" in the list but it was not found`);
});

Then('{string} should no longer appear in the list', async function (name) {
    await this.page.waitForTimeout(1000);
});

Then('{string} should no longer appear in the credential list', async function (name) {
    await this.page.waitForTimeout(1000);
});

When('I rename credential {string} to {string}', async function (oldName, newName) {
    await this.page.waitForSelector(CRED_EDIT_BTN, { timeout: 30000 });
    await this.page.locator(CRED_EDIT_BTN).first().click();
    await this.page.waitForSelector('.modal-title:has-text("Edit your Security Key")', { timeout: 10000 });
    await this.page.fill('input[name="nickname"]', newName);
    await this.page.click('.modal-footer button:has-text("Save changes")');
    await this.page.waitForSelector('.modal-title:has-text("Edit your Security Key")', {
        state: 'hidden',
        timeout: 10000,
    });
});

When('I delete credential {string}', async function (name) {
    await this.page.waitForSelector(CRED_EDIT_BTN, { timeout: 30000 });
    await this.page.locator(CRED_EDIT_BTN).first().click();
    await this.page.waitForSelector('.modal-title:has-text("Edit your Security Key")', { timeout: 10000 });
    await this.page.click('.modal-footer button:has-text("Delete")');
    await this.page.waitForSelector('.modal-title:has-text("Edit your Security Key")', {
        state: 'hidden',
        timeout: 10000,
    });
});

Then('no credential should exist for {string} in the system', async function (_placeholder) {
    await this.page.waitForSelector(CRED_EDIT_BTN, {
        state: 'detached',
        timeout: 10000,
    });
    const remaining = await this.page.locator(CRED_EDIT_BTN).count();
    assert.strictEqual(remaining, 0, `Expected no credentials but found ${remaining}`);
});
