/**
 * Login Page Locators
 * All locators for SCS Login Page
 */
module.exports = {
  usernameInput: 'input[name="userName"]',
  passwordInput: 'input[name="passWord"]',
  loginButton: 'button:has-text("Log In")',
  errorMessage: '.error-message, [role="alert"], .alert-danger',
  rememberMeCheckbox: 'input[type="checkbox"]',
  forgotPasswordLink: 'a:has-text("Forgot Password"), a:has-text("forgot password")',
  logoutButton: 'button:has-text("Logout"), a:has-text("Logout")',
  healthSafetyMessage: 'text=Health & Safety Message',
  loginPageTitle: 'h1, .login-title',
  usernameLabel: 'label:has-text("Username"), label:has-text("User Name")',
  passwordLabel: 'label:has-text("Password")',
  validationMessage: '.validation-message, .field-validation-error',
};
