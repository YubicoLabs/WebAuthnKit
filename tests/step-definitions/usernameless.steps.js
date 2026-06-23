const { When } = require('@cucumber/cucumber');

// The virtual authenticator holds the resident key created during registration
// and responds automatically when navigator.credentials.get() is called without
// a username (usernameless flow). No explicit action is needed here.
When('the virtual authenticator returns the credential for {string}', async function (_placeholder) {
    // Log the virtual authenticator credentials to verify resident key exists
    const { credentials } = await this.cdpSession.send('WebAuthn.getCredentials', {
        authenticatorId: this.virtualAuthenticatorId,
    });
    console.log(`[DEBUG] Virtual authenticator credentials: ${JSON.stringify(credentials.map(c => ({
        id: c.credentialId.slice(0, 20) + '...',
        isResidentCredential: c.isResidentCredential,
        rpId: c.rpId,
        userHandle: c.userHandle?.slice(0, 20),
    })))}`);

    // Wait for the page to settle — the usernameless flow starts automatically
    // on mount via useEffect. Give it time for the WebAuthn ceremony to complete.
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    // Log any errors
    const url = this.page.url();
    console.log(`[DEBUG] Page URL after usernameless wait: ${url}`);
});
