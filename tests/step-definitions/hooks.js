const { Before, After } = require('@cucumber/cucumber');
const { chromium } = require('playwright');

Before(async function () {
    const headless = process.env.HEADLESS !== 'false';
    this.browser = await chromium.launch({ headless });
    this.context = await this.browser.newContext({ ignoreHTTPSErrors: true });

    // Page must exist before opening a CDP session
    this.page = await this.context.newPage();

    // Attach a virtual CTAP2 USB security key via the Chrome DevTools Protocol.
    // hasResidentKey: true supports both regular and usernameless (discoverable) flows.
    this.cdpSession = await this.context.newCDPSession(this.page);
    await this.cdpSession.send('WebAuthn.enable', { enableUI: false });
    const { authenticatorId } = await this.cdpSession.send('WebAuthn.addVirtualAuthenticator', {
        options: {
            protocol: 'ctap2',
            transport: 'usb',
            hasResidentKey: true,
            hasUserVerification: true,
            isUserVerified: true,
        },
    });
    this.virtualAuthenticatorId = authenticatorId;

    this.testUsername = null;
    this.recoveryCodes = [];
    this.usedRecoveryCode = null;


    // Intercept ALL Cognito API calls to see what's happening
    await this.context.route('**cognito-idp**', async (route) => {
        const req = route.request();
        const target = req.headers()['x-amz-target'] || '';
        const body = req.postData() || '';
        const response = await route.fetch();
        const resBody = await response.text().catch(() => '[unreadable]');
        // Log the full request body for RespondToAuthChallenge to see the credential
        if (target.includes('RespondToAuthChallenge')) {
            try {
                const parsed = JSON.parse(body);
                if (parsed.ChallengeResponses?.ANSWER) {
                    const answer = JSON.parse(parsed.ChallengeResponses.ANSWER);
                    console.log(`[COGNITO] ${target} ANSWER.requestId=${answer.requestId}`);
                    if (answer.credential?.response) {
                        console.log(`[COGNITO] credential.id=${answer.credential.id}`);
                        console.log(`[COGNITO] clientDataJSON(decoded)=${Buffer.from(answer.credential.response.clientDataJSON, 'base64url').toString('utf8')}`);
                    }
                }
            } catch (e) { /* ignore parse errors */ }
        }
        console.log(`[COGNITO] ${target}: req=${body.slice(0, 300)} → ${response.status()}: ${resBody.slice(0, 800)}`);
        await route.fulfill({ response });
    });
    this.page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        // Log all console messages to trace signUp flow
        console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
    });
});

After(async function () {
    // Unroute all interceptors (page AND context) before closing so pending
    // requests don't throw "Target page, context or browser has been closed" errors.
    await this.page?.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
    await this.context?.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
    await this.page?.close().catch(() => {});
    await this.context?.close().catch(() => {});
    await this.browser?.close().catch(() => {});
});
