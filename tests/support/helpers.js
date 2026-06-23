const APP_URL = process.env.APP_URL || 'https://dev.d2eh2tf6lhqm25.amplifyapp.com';

// Generate a unique username for each test run to avoid Cognito state conflicts.
// Cognito usernames are case-insensitive; the app enforces max 20 chars.
function uniqueUsername(base) {
    const suffix = Date.now().toString().slice(-8);
    return `${base}${suffix}`.slice(0, 20);
}

async function navigateToLogin(page) {
    // Clear the custom user key so the Redux auth reducer starts with empty initialState.
    // Without this, a logged-in session causes LoginPage to redirect away
    // where the virtual authenticator auto-signs-in again, creating an infinite loop.
    await page.evaluate(() => localStorage.removeItem('user')).catch(() => {});

    await page.goto(`${APP_URL}/login`);
    // LoginPage dispatches userActions.logout() (Amplify signOut) on mount, but the Redux
    // authUser may still be set if localStorage.user was present. Wait for the page to settle.
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    if (!page.url().endsWith('/login')) {
        // Redirected away — clear session state and navigate back.
        await page.evaluate(() => localStorage.removeItem('user')).catch(() => {});
        await page.goto(`${APP_URL}/login`);
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    }
    await page.waitForSelector('input[name="username"]', { timeout: 30000 });
}

// Registers a brand-new user via the UI and lands on the dashboard.
// Requires a virtual authenticator to be attached to the browser context.
//
// Upstream flow: Enter username on /login → click "Continue" →
// app navigates to /register → RegisterPage's useEffect calls signOut() →
// click "Continue" to trigger WebAuthn ceremony → lands on dashboard.
async function registerUser(page, username) {
    await navigateToLogin(page);
    await page.fill('input[name="username"]', username);
    await page.click('button:has-text("Continue")');
    await page.waitForURL('**/register', { timeout: 20000 });
    // RegisterPage's useEffect calls signOut() async. Wait for it to finish
    // before clicking Continue to avoid a race where signOut()
    // invalidates the session established by confirmSignIn().
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.click('button:has-text("Continue")');
    await page.waitForURL(`${APP_URL}/`, { timeout: 60000 });
}

// Signs in an already-registered user and lands on the dashboard.
//
// Upstream flow: Enter username on /login → click "Continue" →
// WebAuthn ceremony auto-starts in the InitUserStep within /login →
// after success, navigates to dashboard.
async function signInUser(page, username) {
    await navigateToLogin(page);
    await page.fill('input[name="username"]', username);
    await page.click('button:has-text("Continue")');
    await page.waitForURL(`${APP_URL}/`, { timeout: 60000 });
}

// Navigates the already-registered user to the login page and enters the username.
// In the upstream, there is no separate /loginWithSecurityKey page — the WebAuthn
// ceremony auto-starts when "Continue" is clicked. This helper just gets to the
// point where the user can access the "Forgot Your Security Key?" link.
async function navigateToLoginWithUsername(page, username) {
    await navigateToLogin(page);
    await page.fill('input[name="username"]', username);
}

// Captures recovery codes from the dashboard.
// The modal auto-opens on the first dashboard visit after registration (recoveryCodesViewed === false).
// If it doesn't auto-open, falls back to clicking "Recovery Codes".
// Returns an array of 5 code strings.
async function captureRecoveryCodes(page) {
    const AUTO_OPEN_TIMEOUT = 8000;

    const modalVisible = await page.waitForSelector(
        '.modal-title:has-text("Recovery Codes")',
        { timeout: AUTO_OPEN_TIMEOUT }
    ).then(() => true).catch(() => false);

    if (!modalVisible) {
        // Modal did not auto-open; trigger it manually
        await page.click('button:has-text("Recovery Codes")');
        await page.waitForSelector('.modal-title:has-text("Recovery Codes")', { timeout: 10000 });
    }

    // If no codes exist yet, click Generate to create them
    const codeLocator = page.locator('.modal-body ul li');
    const codesExist = await codeLocator.count() > 0;
    if (!codesExist) {
        await page.click('button:has-text("Generate")');
    }

    // Wait until all 5 codes are rendered (Lambda cold-start can take 10-15s)
    await codeLocator.nth(4).waitFor({ timeout: 45000 });

    const count = await codeLocator.count();
    const codes = [];
    for (let i = 0; i < count; i++) {
        const text = (await codeLocator.nth(i).textContent()).trim();
        if (text.length > 0) {
            codes.push(text);
        }
    }

    // Use "Not now" (not "Ignore") so that localStorage is NOT set.
    // The exhaustion scenario needs ignoreModal===false so the modal can
    // auto-open when allRecoveryCodesUsed===true.
    await page.click('.modal-footer button:has-text("Not now")');
    await page.waitForSelector('.modal-title:has-text("Recovery Codes")', {
        state: 'hidden', timeout: 10000,
    });
    return codes;
}

// Signs out via the Sign Out button and waits for the login URL.
async function signOutUser(page) {
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('**/login', { timeout: 10000 }).catch(() => {});
}

// Opens recovery code modal via "Forgot Your Security Key?" → enters code → submits.
// In the upstream, recovery codes are accessed from the ForgotStep within /login.
async function signInWithRecoveryCode(page, username, code) {
    await page.click('text=Forgot Your Security Key?');
    await page.waitForSelector('input[name="recoverycode"]', { timeout: 10000 });
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="recoverycode"]', code);
    await page.click('button:has-text("Continue")');
    await page.waitForURL('**/', { timeout: 30000 });
}

// Dismisses the Recovery Codes modal if currently visible.
async function dismissRecoveryCodesModal(page) {
    const visible = await page.isVisible('.modal-title:has-text("Recovery Codes")');
    if (visible) {
        await page.click('.modal-footer button:has-text("Ignore")');
        await page.waitForSelector('.modal-title:has-text("Recovery Codes")', {
            state: 'hidden', timeout: 10000,
        });
    }
}

module.exports = {
    APP_URL,
    uniqueUsername,
    navigateToLogin,
    registerUser,
    signInUser,
    navigateToLoginWithUsername,
    captureRecoveryCodes,
    signOutUser,
    signInWithRecoveryCode,
    dismissRecoveryCodesModal,
};
