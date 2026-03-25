/**
 * Administration User Page Locators
 * All locators for SCS Administration User Page
 */
module.exports = {
  // Navigation locators
  administrationTab: 'text=ADMINISTRATION',
  siteListText: 'text=SITE LIST',
  usersMenu: 'text=Users',
  listMenuItem: 'text=List',

  // User list locators
  filterSearchInput: 'input[placeholder="Search"]',
  selectAllCheckbox: 'text=Select All',
  okButton: 'button:has-text("OK")',
  editButton: 'button:has-text("Edit")',

  // Site Access and Permissions locators
  siteAccessPermissionsHeader: 'text=SITE ACCESS AND PERMISSIONS',
  groupAccessPermissionsHeader: 'text=GROUP ACCESS AND PERMISSIONS',
  showSitesNoAccessRadio: 'text=Show sites with no access granted',
  showSitesWithAccessRadio: 'text=Show sites with access granted',
  showGroupsNoAccessRadio: 'text=Show groups with no access granted',
  showGroupsWithAccessRadio: 'text=Show groups with access granted',
  showPermissionColumnsCheckbox: 'text=Show permission columns',
  saveButton: 'button:has-text("Save")',

  // Access Status and Expiration locators
  accessStatusColumn: '[aria-label="Access Status"]',
  accessExpirationDateColumn: '[aria-label="Access Expiration Date"]',
  permissionsForModuleDropdown: 'label:has-text("Permissions for Module")',

  // Grid locators
  gridContent: '.e-gridcontent',
  gridRow: '.e-row',
  grid: '.e-grid',
  gridHeader: '.e-gridheader',
  headerCell: '.e-headercell',
  headerCellDiv: '.e-headercelldiv',
  filterMenuDiv: '.e-filtermenudiv.e-icon-filter',
  excelFilter: '[aria-label="Excel filter"]',
  listItem: '.e-list-item',
  resizeHandler: '.e-resize-handler.e-icons',

  // Dialog and popup locators
  dialogHeader: '.e-dlg-header-content',

  // Checkbox and radio input
  checkboxInput: 'input[type="checkbox"]',
  radioInput: 'input[type="radio"]',

  // Column header names
  columns: {
    firstName: 'First name',
    siteList: 'Site List',
    accessStatus: 'Access Status',
    accessExpiration: 'Access Expiration',
  },

  // Test-specific timeouts (for User Status Report - Test 34)
  testTimeouts: {
    TREE_VIEW_LOAD: 15000,
    REPORT_GENERATION: 7000,
    CONTENT_STABILIZATION: 3000,
    SHORT_WAIT: 2000,
    ELEMENT_VISIBILITY: 10000,
    SCROLL_WAIT: 1000,
    // Grid and UI state change waits
    GRID_STABILIZATION: 3000,  // Wait for grid re-render after state change
    CHECKBOX_READY: 2000,      // Wait for checkbox/form state to settle
    FILTER_DELAY: 1000,        // Wait after filter or action applied
    SHORT_POLL_INTERVAL: 500,  // Polling loop interval in retry operations
  },

  // Date validation patterns
  datePatterns: {
    MM_DD_YYYY: /^\d{2}\/\d{2}\/\d{4}$/,
  },

  // Column header configurations
  columnHeaders: {
    LAST_LOGON: { first: 'Last Logon', second: 'Date' },
    ACCESS_EXPIRATION: { first: 'Access', second: 'Expiration' },
    CREATED_DATE: 'Created Date',
  },
};
