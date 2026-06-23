const { When, Then } = require('@cucumber/cucumber');
const { APP_URL } = require('../support/helpers');

// Clicks the confirm button inside the Delete Account modal.
// Bootstrap's .modal.show class is added at animation START (not end), so the
// button is still moving during the 300ms fade transition. Use force:true to
// bypass Playwright's stability check and dispatch the click directly.
When('I confirm account deletion', async function () {
    await this.page.waitForSelector('.modal-title:has-text("Delete account")', { timeout: 10000 });
    await this.page.waitForSelector('.modal.show', { timeout: 5000 });
    await this.page.locator('.modal-footer button:has-text("Delete")').click({ force: true });
});

// Clicks the cancel/close button inside the Delete Account modal.
When('I cancel account deletion', async function () {
    await this.page.waitForSelector('.modal-title:has-text("Delete account")', { timeout: 10000 });
    await this.page.waitForSelector('.modal.show', { timeout: 5000 });
    await this.page.click('.modal-footer button:has-text("Close")');
    await this.page.waitForSelector('.modal-title:has-text("Delete account")', {
        state: 'hidden',
        timeout: 10000,
    });
});

// After cancellation the user should remain on the dashboard (no navigation).
Then('I should still be on the dashboard', async function () {
    const url = this.page.url();
    const onDashboard = url === `${APP_URL}/` || url === `${APP_URL}`;
    if (!onDashboard) {
        // Give a moment in case of a transient navigation
        await this.page.waitForURL(`${APP_URL}/`, { timeout: 5000 }).catch(() => {});
    }
    const finalUrl = this.page.url();
    const stillOnDashboard = finalUrl === `${APP_URL}/` || finalUrl === `${APP_URL}`;
    if (!stillOnDashboard) {
        throw new Error(`Expected to stay on dashboard but navigated to: ${finalUrl}`);
    }
});
