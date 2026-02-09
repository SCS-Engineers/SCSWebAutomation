# Credentials Management Guide

## 🔒 Security Overview

This project uses **environment variables** to manage sensitive credentials securely. All passwords, usernames, and sensitive configuration are stored in `.env` files that are **never committed to version control**.

## 🚀 Quick Setup

### 1. Copy the Environment Template

```bash
cp .env.example .env
```

### 2. Fill in Your Credentials

Open `.env` and replace placeholder values with actual credentials:

```env
# Valid User Credentials
VALID_USER_USERNAME=your_username_here
VALID_USER_PASSWORD=your_password_here
VALID_USER_FIRSTNAME=Your_Firstname
VALID_USER_LASTNAME=Your_Lastname

# ... (continue for all required variables)
```

### 3. Verify Setup

Run a test to ensure credentials are loaded correctly:

```bash
npm test -- test/Authentication/Login/login-scs.spec.js
```

## 📁 File Structure

```
SCS/
├── .env                    # Your actual credentials (NEVER commit!)
├── .env.example            # Template with placeholder values
├── .gitignore              # Ensures .env is not committed
├── utils/
│   └── credentials.js      # Secure credential loader
└── data/
    └── testData.json       # Non-sensitive test data only
```

## 🔐 How It Works

### credentials.js

The `credentials.js` module:
1. **Loads environment variables** from `.env` using `dotenv`
2. **Falls back to testData.json** if env vars are not set (for backward compatibility)
3. **Provides consistent API** - all existing tests work without changes

### Example Usage

```javascript
const credentials = require('../utils/credentials');

// Get user credentials
const user = credentials.getUserCredentials('validUser');
console.log(user.username); // Reads from process.env.VALID_USER_USERNAME

// Get URLs
const loginUrl = credentials.getUrl('loginPage');
console.log(loginUrl); // Reads from process.env.LOGIN_PAGE_URL

// Get test data
const changePasswordData = credentials.getTestData('changePassword');
console.log(changePasswordData.initialPassword); // Reads from process.env.CHANGE_PASSWORD_INITIAL
```

## 🛡️ Security Best Practices

### ✅ DO:
- Store `.env` file securely on your local machine
- Use strong, unique passwords for each user type
- Rotate credentials regularly
- Keep `.env` out of version control (already in `.gitignore`)
- Share credentials through secure channels (password managers, encrypted files)

### ❌ DON'T:
- Never commit `.env` to Git
- Never share `.env` files via email or chat
- Never hardcode credentials in test files
- Never log passwords in console output

## 🔄 Environment Variables Reference

### User Credentials

| Variable | Description | Example |
|----------|-------------|---------|
| `VALID_USER_USERNAME` | Valid test user username | `peter` |
| `VALID_USER_PASSWORD` | Valid test user password | `Testing.123` |
| `VALID_USER_FIRSTNAME` | User's first name | `Peter` |
| `VALID_USER_LASTNAME` | User's last name | `User` |
| `NON_APPLICABLE_USER_USERNAME` | Non-applicable user username | `aqabmtest5` |
| `NON_APPLICABLE_USER_PASSWORD` | Non-applicable user password | `Test123@` |
| `NO_ACCESS_USER_USERNAME` | No-access user username | `noaccessuser` |
| `NO_ACCESS_USER_PASSWORD` | No-access user password | `Testing.123` |
| `INVALID_USERNAME_USER` | Invalid username for negative tests | `invalidUser` |
| `INVALID_USERNAME_PASSWORD` | Password for invalid username test | `Testing.123` |
| `INVALID_PASSWORD_USERNAME` | Valid username for wrong password test | `peter` |
| `INVALID_PASSWORD_PASSWORD` | Wrong password for testing | `wrongPassword` |
| `INVALID_BOTH_USERNAME` | Invalid username (both wrong) | `invalidUser` |
| `INVALID_BOTH_PASSWORD` | Invalid password (both wrong) | `wrongPassword` |

### Application URLs

| Variable | Description | Example |
|----------|-------------|---------|
| `LOGIN_PAGE_URL` | Application login page URL | `https://ajs.scsetools.com/login` |
| `HOME_PAGE_URL` | Application home page URL | `https://ajs.scsetools.com/home` |

### Test Data

| Variable | Description | Example |
|----------|-------------|---------|
| `CHANGE_PASSWORD_INITIAL` | Initial password for change password tests | `Test123@` |
| `CHANGE_PASSWORD_NEW` | New password for change password tests | `Test345@` |
| `CHANGE_PASSWORD_INVALID` | Invalid password format for validation | `Testing.12345!@#$%` |

## 🧪 Running Tests

All existing tests continue to work without any changes:

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- test/Authentication/Login/login-scs.spec.js

# Run with headed browser
npm run test:headed

# Run in debug mode
npm run test:debug
```

## 🔍 Troubleshooting

### Issue: Tests fail with "undefined" credentials

**Solution:** Ensure `.env` file exists and contains all required variables.

```bash
# Check if .env exists
ls -la .env

# If not, copy from template
cp .env.example .env
```

### Issue: Warning messages about missing environment variables

**Solution:** Fill in all required variables in `.env` file. Check console output for specific missing variables.

### Issue: Credentials not loading

**Solution:** Ensure `dotenv` is installed:

```bash
npm install dotenv --save-dev
```

## 📝 Adding New Credentials

### 1. Add to `.env.example`

```env
# New User Type
NEW_USER_USERNAME=
NEW_USER_PASSWORD=
```

### 2. Add to your local `.env`

```env
# New User Type
NEW_USER_USERNAME=actual_username
NEW_USER_PASSWORD=actual_password
```

### 3. Update `credentials.js`

```javascript
const users = {
  // ... existing users ...
  newUser: buildUserCredentials('NEW_USER', testData.users.newUser)
};
```

### 4. Update `testData.json` (with placeholder)

```json
{
  "users": {
    "newUser": {
      "username": "PLACEHOLDER_USE_ENV",
      "password": "PLACEHOLDER_USE_ENV"
    }
  }
}
```

## 🔄 Migration Notes

### For Existing Tests

**No changes required!** All existing tests continue to work:

```javascript
// This still works exactly as before
const credentials = require('../utils/credentials');
const user = credentials.getUserCredentials('validUser');
```

### Backward Compatibility

The system maintains full backward compatibility:
- If `.env` exists → Uses environment variables ✅
- If `.env` missing → Falls back to `testData.json` ⚠️ (shows warning)
- Existing test code → Works without modification ✅

## 📞 Support

For questions or issues with credentials setup:
1. Check this README
2. Verify `.env` file format matches `.env.example`
3. Ensure all required environment variables are set
4. Check console for specific error messages

---

**Remember:** Security is everyone's responsibility. Never commit credentials to version control!
