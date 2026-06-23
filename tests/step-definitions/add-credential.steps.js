const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Fills the nickname field in the visible (open) modal.
// There are two input[name="nickname"] elements in the DOM (Edit + Add modals).
// Scoping to .modal.show ensures we target the currently open modal's input.
// Also stores the nickname on `this` so the register step can re-apply it if
// the Credentials component was remounted (see note in register step).
When('I fill in the nickname {string}', async function (nickname) {
    this.credentialNickname = nickname;
    // The AddCredential modal does not include a nickname field — the nickname
    // defaults to "Security Key". Only attempt to fill it if the field is present
    // (e.g., future versions may add it back).
    const input = this.page.locator('.modal.show input[name="nickname"]');
    const isVisible = await input.isVisible().catch(() => false);
    if (isVisible) {
        await input.click({ clickCount: 3 }); // select-all to clear existing value
        await input.pressSequentially(nickname);
    }
});

// Clicks "Register Security Key" in the Add modal, handling two failure modes:
//
// 1. excludeCredentials conflict — the server includes the existing credential ID in
//    excludeCredentials, causing the virtual authenticator to refuse a second ceremony.
//    Fix: remove all credentials from the virtual authenticator first so the server's
//    excludeCredentials list finds no match.
//
// 2. React state reset — the `Credentials` function component is defined inline inside
//    `HomePage`, so every `HomePage` re-render creates a new component reference,
//    causing React to unmount/remount `Credentials` with fresh state (nickname = '').
//    Fix: check and re-apply the nickname right before clicking the button.
//
// After clicking, wait for the credential count to increase. The wait budget is 90 s
// to absorb Lambda cold-starts in the FIDO2KitAPI Lambda.
When('I register the new security key', async function () {
    // Count existing credentials before registering
    const CRED_EDIT_BTN = '.card:has(h5:has-text("Security Keys")) button:has-text("Edit")';
    const countBefore = await this.page.locator(CRED_EDIT_BTN).count();

    // Snapshot and remove existing credentials from the virtual authenticator
    const { credentials: existingCreds } = await this.cdpSession.send('WebAuthn.getCredentials', {
        authenticatorId: this.virtualAuthenticatorId,
    });
    for (const cred of existingCreds) {
        await this.cdpSession.send('WebAuthn.removeCredential', {
            authenticatorId: this.virtualAuthenticatorId,
            credentialId: cred.credentialId,
        });
    }

    await this.page.waitForSelector('.modal.show', { timeout: 5000 });

    // Re-apply nickname if React state was reset between steps
    if (this.credentialNickname) {
        const nicknameInput = this.page.locator('.modal.show input[name="nickname"]');
        const isInputVisible = await nicknameInput.isVisible();
        if (isInputVisible) {
            const currentValue = await nicknameInput.inputValue();
            if (currentValue !== this.credentialNickname) {
                await nicknameInput.fill(this.credentialNickname);
            }
        }
    }

    await this.page.click('.modal-footer button:has-text("Register Security Key")');

    // Wait for the credential count to increase.
    // Credentials render as div.d-flex rows with a <button>Edit</button> inside the Security Keys card.
    const expectedCount = countBefore + 1;
    await this.page.waitForFunction(
        (expected) => {
            const card = document.querySelector('.card');
            // Find the Security Keys card by its h5 header
            const cards = document.querySelectorAll('.card');
            let secKeyCard = null;
            cards.forEach(c => {
                if (c.querySelector('h5') && c.querySelector('h5').textContent.includes('Security Keys')) {
                    secKeyCard = c;
                }
            });
            if (!secKeyCard) return false;
            const buttons = secKeyCard.querySelectorAll('button');
            let count = 0;
            buttons.forEach(btn => {
                if (btn.textContent.trim() === 'Edit') count++;
            });
            return count >= expected;
        },
        expectedCount,
        { timeout: 90000 }
    );
});

// Asserts the total credential count.
Then('I should have {int} registered credentials', async function (expectedCount) {
    const credItems = this.page.locator('.card:has(h5:has-text("Security Keys")) button:has-text("Edit")');
    const count = await credItems.count();
    assert.strictEqual(count, expectedCount, `Expected ${expectedCount} credentials but found ${count}`);
});
