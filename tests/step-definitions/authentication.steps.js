const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// Handles both "registereduser" (maps to this.testUsername from the Background setup)
// and "unknownuser" (generates a username guaranteed not to exist in Cognito).
When('I enter username {string}', async function (placeholder) {
    let username;
    if (placeholder === 'unknownuser') {
        username = `unk${Date.now()}`;
    } else {
        username = this.testUsername;
    }
    await this.page.fill('input[name="username"]', username);
});
