/**
 * Change Password Page Locators
 * All locators for Change Password functionality
 */
module.exports = {
  usernameButton: 'button:has-text("Automation User"), [aria-label="User menu"]',
  changePasswordMenuOption: 'ejs-button',
  changePasswordPopup: '.e-dialog, [role="dialog"]',
  currentPasswordField: 'input[name="currentPassword"], #currentPassword',
  dialogTitle: '.e-dlg-header, .dialog-title',
  dialogContent: '.e-dlg-content, .dialog-content',
  closeButton: 'button:has-text("Close"), .e-dlg-closeicon-btn',
  confirmationText: 'text=Are you sure you want to change your password?',
  yesButton: 'button:has-text("Yes")',
  noButton: 'button:has-text("No")',
  toastMessage: '[role="alert"]',
  dashboardText: 'text=Dashboard'
};
