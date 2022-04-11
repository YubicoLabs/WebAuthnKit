# WebAuthn Starter Kit Web App

## Run Example

1. Install Node.js
1. Clone repository
1. Change directory to the web app
1. Install npm packages. Run `npm install`
1. Start the web app. Run `npm start`

## Configuring Linter

The .eslintrc file should already be in this project. In order to get live changes follow these steps:

1. Install the esLint VS Code Extension
2. Download the Prettier VS Code Extension
3. In VS Code go to File -> Preferences -> Settings and add the following lines

```json
  "[javascript]": {
    "editor.formatOnSave": false
  }
  "editor.tabSize": 2,
  "eslint.alwaysShowStatus": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
```

## Credits

Thanks to [https://github.com/cornflourblue](https://github.com/cornflourblue) for the
[React Hooks + Redux - User Registration and Login Example](https://github.com/cornflourblue/react-hooks-redux-registration-login-example)
