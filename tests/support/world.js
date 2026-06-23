const { setWorldConstructor, World, setDefaultTimeout } = require('@cucumber/cucumber');

// Default Cucumber step timeout is 5 s — far too short for Playwright + network calls.
setDefaultTimeout(120 * 1000);

class CustomWorld extends World {
    constructor(options) {
        super(options);
        this.browser = null;
        this.context = null;
        this.page = null;
        this.virtualAuthenticator = null;
        // Unique username created per scenario (avoids state conflicts across runs)
        this.testUsername = null;
        // Recovery codes captured from the dashboard after registration
        this.recoveryCodes = [];
        // A code that has already been used (for the "already-used" scenario)
        this.usedRecoveryCode = null;
    }
}

setWorldConstructor(CustomWorld);
