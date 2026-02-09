# Playwright POM Project

This is a Playwright test automation project using the Page Object Model (POM) design pattern with **secure environment-based credential management**.

## 🔒 Quick Setup (First Time Users)

**IMPORTANT:** Before running tests, set up your credentials:

```bash
# 1. Copy the environment template
cp .env.example .env

# 2. Edit .env and add your actual credentials
# (Use your preferred text editor)

# 3. Run tests
npm test
```

📖 **Full setup guide:** See [docs/CREDENTIALS_GUIDE.md](docs/CREDENTIALS_GUIDE.md)

## Project Structure

```
├── .env                   # Your credentials (NEVER commit!)
├── .env.example           # Credentials template
├── data/                  # Test data files
│   └── testData.json     # Non-sensitive test data
├── pages/                 # Page Object Model classes
│   ├── basePage.js       # Base page with common methods
│   ├── loginPage.js      # Login page object
│   └── homePage.js       # Home page object
├── test/                  # Test files
│   ├── Authentication/   # Login and auth tests
│   └── Data Services/    # Dashboard tests
├── utils/                 # Utility files
│   ├── credentials.js    # Secure credential loader (env vars)
│   └── helper.js         # Helper functions
├── docs/                  # Documentation
│   └── CREDENTIALS_GUIDE.md  # Complete credentials guide
├── playwright.config.js   # Playwright configuration
└── package.json          # Project dependencies
```

## Features

- 🔐 **Secure Credentials**: Environment variable-based credential management
- **Page Object Model (POM)**: Organized page classes for better maintainability
- **Base Page**: Common methods inherited by all page objects
- **Test Data Management**: JSON-based test data storage
- **Credentials Handler**: Utility for managing test credentials securely
- **Helper Functions**: Reusable utility functions
- **Multiple Browser Support**: Chromium, Firefox, and WebKit
- **Allure Reporting**: Comprehensive test reports

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. **Set up credentials (REQUIRED):**
```bash
cp .env.example .env
# Then edit .env with your actual credentials
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in headed mode:
```bash
npm run test:headed
```

Run tests in debug mode:
```bash
npm run test:debug
```

View test report:
```bash
npm run report
```

## Page Objects

### BasePage
Common methods available in all page objects:
- `navigateTo(url)` - Navigate to URL
- `click(selector)` - Click element
- `fill(selector, text)` - Fill input field
- `getText(selector)` - Get element text
- `isVisible(selector)` - Check visibility
- `waitForElement(selector)` - Wait for element
- And many more...

### LoginPage
Methods specific to login page:
- `login(username, password)` - Complete login flow
- `enterUsername(username)` - Enter username
- `enterPassword(password)` - Enter password
- `getErrorMessage()` - Get error message

### HomePage
Methods specific to home page:
- `search(searchText)` - Perform search
- `isUserLoggedIn()` - Check login status
- `logout()` - Logout user

## Test Data & Credentials

### 🔐 Secure Credential Management

All sensitive credentials are stored in environment variables (`.env` file):

```javascript
const credentials = require('../utils/credentials');

// Get user credentials (reads from .env)
const user = credentials.getUserCredentials('validUser');
console.log(user.username); // from process.env.VALID_USER_USERNAME

// Get URL (reads from .env)
const url = credentials.getUrl('loginPage');

// Get test data
const keyword = credentials.getTestData('searchKeyword');
```

**Features:**
- ✅ Environment variables take precedence
- ✅ Falls back to testData.json if .env not found
- ✅ No code changes needed for existing tests
- ✅ Credentials never committed to Git

📖 **Complete guide:** [docs/CREDENTIALS_GUIDE.md](docs/CREDENTIALS_GUIDE.md)

### Security Best Practices

- ❌ **NEVER** commit `.env` file to Git (already in `.gitignore`)
- ❌ **NEVER** hardcode credentials in test files
- ✅ **ALWAYS** use `credentials.getUserCredentials()` to get credentials
- ✅ **ALWAYS** store sensitive data in `.env` file
- ✅ **ALWAYS** use `.env.example` as template for new setup

## Writing New Tests

1. Create a new page object in `pages/` folder extending `BasePage`
2. Add test data to `data/testData.json`
3. Create test file in `test/` folder
4. Import required page objects and utilities
5. Write test cases using Playwright test framework

## Best Practices

- Keep page objects clean and focused
- Use descriptive method names
- Store test data in JSON file
- Use BasePage common methods
- Add proper waits and assertions
- Follow consistent naming conventions
