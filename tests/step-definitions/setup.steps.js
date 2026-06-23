// Background "Given" steps shared across multiple features.
// Each step generates a unique username so scenarios don't collide on shared state.

const { Given } = require('@cucumber/cucumber');
const { uniqueUsername, registerUser, navigateToLogin } = require('../support/helpers');

// Used in: authentication.feature, recovery-codes.feature
// Registers a fresh user via the UI. Ends on the dashboard.
// Subsequent Background steps handle any further navigation needed.
Given('{string} is registered with a security key', async function (_placeholder) {
    this.testUsername = uniqueUsername('u');
    await registerUser(this.page, this.testUsername);
});

// Used in: usernameless-login.feature
// Registration uses residentKey: "preferred", so the authenticator should create a
// discoverable credential when capable. If the deployed backend still uses the legacy
// requireResidentKey: false (DISCOURAGED), the virtual authenticator won't create one
// automatically. We detect this and upgrade the credential for testing, logging a warning.
Given('{string} is registered with a discoverable credential', async function (_placeholder) {
    this.testUsername = uniqueUsername('ul');
    await registerUser(this.page, this.testUsername);

    const { credentials } = await this.cdpSession.send('WebAuthn.getCredentials', {
        authenticatorId: this.virtualAuthenticatorId,
    });
    const hasResident = credentials.some(c => c.isResidentCredential);
    if (!hasResident) {
        console.warn(
            '[WARN] Registration did not create a discoverable credential. ' +
            'The deployed backend may still use requireResidentKey: false. ' +
            'Upgrading credential to resident for test purposes.'
        );
        for (const cred of credentials) {
            await this.cdpSession.send('WebAuthn.removeCredential', {
                authenticatorId: this.virtualAuthenticatorId,
                credentialId: cred.credentialId,
            });
            await this.cdpSession.send('WebAuthn.addCredential', {
                authenticatorId: this.virtualAuthenticatorId,
                credential: { ...cred, isResidentCredential: true },
            });
        }
    }
});

// Used in: credential-management.feature
// Registers and then signs in, landing on the dashboard.
Given('{string} is signed in', async function (_placeholder) {
    this.testUsername = uniqueUsername('cm');
    await registerUser(this.page, this.testUsername);
    // registerUser lands on the dashboard; sign-in is already complete post-registration
});
