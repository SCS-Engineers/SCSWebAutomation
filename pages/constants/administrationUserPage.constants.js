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
    accessExpiration: 'Access Expiration'
  }
};
