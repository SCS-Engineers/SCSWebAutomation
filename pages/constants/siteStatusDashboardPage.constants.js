/**
 * Site Status Dashboard Page Locators
 * All locators for Site Status Dashboard Page
 */
module.exports = {
  // Page locators for Site Status Dashboard - Based on reference code
  healthSafetyOkButton: 'button:has-text("OK")',
  siteCombobox: 'role=combobox[name="00_Site01"]',
  dialogCombobox: 'role=dialog[name="ej2_dropdownlist_0"] >> role=combobox',
  demoSiteOption: 'role=option[name="Demo Site"][exact]',
  landfillGasMapIcon: '#landfill-gas-grid_0_gridcommand48',
  dateRangeCombobox: 'role=combobox[name="Select a date range"]',
  satelliteImageryOption: 'role=menuitemradio[name="Show satellite imagery"]',
  streetMapOption: 'role=menuitemradio[name="Show street map"]',
  mapText: 'text=arrow_left_sharpMAP',
  filterText: 'div:has-text("Filter"):first-child',

  // Fallback locators
  healthSafetyModal: '.modal, .health-safety-modal, [role="dialog"]',
  siteListItem: '.site-list-item, .site-item, [role="option"]',
  siteSearchInput: 'input[placeholder*="Search"], input[placeholder*="site"], input[type="search"], .site-search input',
  mapIcon: '.map-icon, button[aria-label*="Map"], a[aria-label*="Map"], i.fa-map-marker, i.fa-map',
  filterMapContainer: '.filter-map, #filter-map, [data-testid="filter-map"]',

  // Popup/Dialog locators
  popupHeaderSelector: '.e-dlg-header-content',
  closeButtonSelector: 'button .e-btn-icon.e-icon-dlg-close.e-icons',

  // Grid locators
  gridRows: 'tr.e-row',
  filterIconSelector: '.e-filtermenudiv.e-icons.e-icon-filter',
  filterSearchInput: '.e-searchinput.e-input',
  excelFilterLabel: 'Excel filter',
  selectAllText: 'Select All',

  // Status color locators
  statusTextColor: '.statusTextColor',
  yellowStatusBar: '.statusColor.e-yellow',
  orangeStatusBar: '.statusColor.e-orange',

  // Report page locators
  reportFiltersText: 'text=Report Filters',
  reportInformationText: 'text=Report Information',
  reportSummaryText: 'text=Report Summary',
  exceedanceDetailReportText: 'text=Exceedance Detail Report',
  arrowDropUpButton: 'button:has-text("arrow_drop_up")',
  openExceedancesReportTextBox: 'role=textbox[name="Open Exceedances Report"]',

  // Review Edit page locators
  reviewEditToolbar: 'div#review-edit-toolbar, .review-edit-toolbar',
  operationsToolbar: 'div#operations-toolbar, .operations-toolbar',
  missedReadingToolbar: 'div#missed-reading-toolbar, .missed-reading-toolbar',
  siteNameDropdownSelector: '#site-name-dropdown, [aria-label="Site Name"]',
  readingsCountLabel: '.readings-count, #readings-count',
  presetDropdownId: '#preset-dropdown',
  createReportButton: 'button:has-text("Create Report")',

  // Pagination locators
  paginationCountMsg: '.e-pagecountmsg',

  // Filter menu locators
  filterMenuSearchInputSelector: '.e-flmenu input[type="text"]:not([readonly]), .e-input-group input:not([readonly])',
  okButtonSelector: 'button:has-text("OK")',

  // Grid row selectors
  landfillGridRows: 'tr.e-row',
  liquidLevelsGridRows: '#liquid-levels-gird .e-row',

  // Review Edit page specific locators
  readingsLabelSelector: '.readings-label, label:has-text("Readings")',
  readingGridSelector: '#reading-grid, .reading-grid',
  readingGridContentTableSelector: '#reading-grid .e-content table, .reading-grid .e-content table',
  unapprovedOnlyLabelSelector: 'label:has-text("Unapproved Only")',

  // Report page specific locators
  reportDescriptionSelector: '.report-description, #report-description',
  ruleCategoryDropdownSelector: '#rule-category-dropdown, [aria-label="Rule Category"]',
  ruleNameSelector: '.rule-name, #rule-name',

  // Point Specific Monitoring Report locators
  pointsSpecificMonitoringReportTitle: 'text=Points Specific Monitoring Report',
  datePickerInputSelector: '.e-datepicker input, input[type="date"]',
};
