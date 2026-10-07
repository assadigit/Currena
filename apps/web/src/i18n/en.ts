/**
 * English dictionary — SOURCE OF TRUTH.
 * Every string extracted verbatim from the legacy Django templates
 * (Phase 1, docs/FEATURE_MAP.md §9). fa.ts must satisfy this shape.
 * New strings are added HERE first, then translated.
 */
export const en = {
  app: {
    name: 'Currena',
    tagline: 'Real-time rates, easy conversion', // legacy About tagline (fa original: نرخ ارز لحظه‌ای، تبدیل آسان)
    versionLabel: 'Version {version}',
    madeBy: 'Made with ❤️ by Ali Assadi',
    createdBy: 'Created by',
    creatorName: 'Ali Assadi',
    errorTitle: 'Something went wrong',
    errorText: 'This page hit an unexpected error. Your data is safe — try again or head back to the converter.',
    errorRetry: 'Try again',
    errorHome: 'Go to converter',
  },

  nav: {
    home: 'Home',
    receiptGenerator: 'Receipt Generator',
    calculator: 'Calculator',
    liveRates: 'Live Rates',
    insights: 'Insights',
    expenseSplitter: 'Expense Splitter',
    splitSettle: 'Split & Settle',
    batchConverter: 'Batch Converter',
    history: 'History',
    about: 'About',
    receiptShort: 'Receipt',
    splitterShort: 'Splitter',
    settleShort: 'Settle',
    batchShort: 'Batch',
    back: 'Back',
    backToHome: 'Back to Home',
    language: 'Language',
    toggleLanguage: 'Toggle language',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
    toggleTheme: 'Toggle theme',
    menu: 'Menu',
    installApp: 'Install app',
  },

  common: {
    from: 'From',
    to: 'To',
    total: 'Total',
    converted: 'Converted',
    rate: 'Rate',
    source: 'Source',
    copy: 'Copy',
    copied: 'Copied!',
    share: 'Share',
    clear: 'Clear',
    cancel: 'Cancel',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Please try again.',
    currency: 'Currency',
    amount: 'Amount',
    date: 'Date',
    time: 'Time',
    description: 'Description',
    lastUpdated: 'Last updated',
    lastCheckedAt: 'Last Checked At:',
    justNow: 'just now',
    minutesAgo: '{n} minute(s) ago',
    hoursAgo: '{n} hour(s) ago',
    daysAgo: '{n} day(s) ago',
    liveUpdate: 'LIVE UPDATE',
    cachedData: 'CACHED DATA',
    viewOnTgju: 'View on TGJU.org',
    generatedWith: '✨ Generated with Currena',
    exchangeRate: 'Exchange Rate',
    offline: 'Offline',
    offlineRatesFrom: 'Offline — showing rates from {source}',
    currencyGroupIranian: 'Iranian Toman',
    currencyGroupInternational: 'International Currencies',
    delete: 'Delete',
    people: 'People',
    noChange: 'no change',
    viewFullBoard: 'View full board',
  },

  sources: {
    tgju: 'TGJU',
    frankfurter: 'Frankfurter',
    manual: 'Manual',
    local: 'Local',
  },

  converter: {
    title: 'Currena - Currency Converter',
    enterAmount: '💵 ENTER AMOUNT',
    amountPlaceholder: '0.00',
    convertNow: '🔄 CONVERT NOW',
    conversionResult: 'Conversion Result',
    customRate: 'Custom Exchange Rate (Optional)',
    enterCustomRate: 'Enter custom rate',
    swapCurrencies: 'Swap currencies',
    fetchingLiveRates: '✨ Fetching live rates...',
    newConversion: '🔄 New Conversion',
    usingCachedRates: 'Using Cached Rates',
    thisRateIsCached: '⚠️ This rate is cached. Last updated:',
    currencyConversion: '💱 Currency Conversion',
    convertedWith: '✨ Converted with Currena',
    shareTitle: 'Currency Conversion Result',
    screenshotSaved: '📋 Screenshot saved & text copied!\nYou can now paste in WhatsApp, Telegram, etc.',
    enterValidAmount: 'Please enter a valid amount',
    conversionFailed: 'Conversion failed. Please check your connection.',
    unableToConvert: 'Unable to convert currency.',
    noInternet: '❌ No internet connection detected.',
    tryingCachedRates: '📦 Trying to use cached rates...',
    connectOnceHint: 'If this continues, you may need to connect to internet at least once to download rates.',
    checkConnection: 'Please try again or check your connection.',
    creating: '⏳ Creating...',
    quickAmounts: 'Quick amounts',
    recentPairs: 'Recent pairs',
    boardAtAGlance: 'Iranian Toman — at a glance',
    quickTools: 'Quick tools',
  },

  currencies: {
    /** Owner rule (2026-09-17): every user-visible "IRR" reads "IRR (Toman)". */
    irrLabel: 'IRR (Toman)',
    USD: 'US Dollar',
    IRR: 'Iranian Toman',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    AED: 'UAE Dirham', // legacy uses both "Emirati Dirham" and "UAE Dirham"; standardized per MIGRATION_CHECKLIST OQ#4
    CNY: 'Chinese Yuan',
    NZD: 'New Zealand Dollar',
    TRY: 'Turkish Lira',
    CHF: 'Swiss Franc',
    JPY: 'Japanese Yen',
    KRW: 'South Korean Won',
    MYR: 'Malaysian Ringgit',
    IDR: 'Indonesian Rupiah',
    PHP: 'Philippine Peso',
    VND: 'Vietnamese Dong',
  },

  /* Gold & coins LED panel (2026-09-27) — TGJU's طلا و سکه market items:
   * global ounce in USD, Tehran market in Toman (÷10 converted from
   * TGJU's printed Rial — owner request 2026-09-19). Keys mirror core's
   * GoldId enum exactly. */
  gold: {
    'gold-ounce': 'Gold Ounce',
    'gold-18k': '18K Gold',
    'gold-24k': '24K Gold',
    'gold-used': 'Used Gold',
    'coin-emami': 'Emami Coin',
    'coin-bahar': 'Bahar Azadi',
    'coin-half': 'Half Coin',
    'coin-quarter': 'Quarter Coin',
    'coin-gram': 'Gram Coin',
  },

  liveRates: {
    title: 'Live Rates',
    /* Per-board headings (owner request 2026-09-28): each LED board now
     * carries its own emoji-marked title + a live-source pill hyperlinked
     * to TGJU + the last-updated stamp — replacing the single page
     * header. */
    currencyBoardHeading: 'Currency Rate Board — Toman',
    goldBoardHeading: 'Gold Rate Board — Toman',
    liveFromTgju: 'Live updates from TGJU',
    couldNotFetch: '⚠️ Could not fetch rates. Please check your connection.',
    refresh: 'Refresh Rates',
    copyRate: 'Copy rate',
    rateCopied: '✅ Rate copied!',
    noChangeSincePrevious: 'No change since the previous update',
    changedSincePrevious: 'Change since the previous update',
    /* LED shopfront board (2026-09-18) — the dark panel that recreates a
     * currency-exchange window display. Columns show TGJU's actual daily
     * stats (2026-09-26): current price, day high, day low — real data,
     * never a derived dealer spread. */
    boardAriaLabel: 'Exchange rate board — current, day-high and day-low Toman rates per currency',
    boardCurrent: 'CURRENT',
    boardHigh: 'DAY HIGH',
    boardLow: 'DAY LOW',
    boardCurrency: 'CURRENCY',
    boardUnitToman: 'Toman',
    boardLive: 'LIVE',
    boardCached: 'CACHED',
    boardOffline: 'OFFLINE',
    /** Per-board footnote: the three columns are TGJU's own daily stats. */
    boardFootnote: 'Current · day high · day low — TGJU open market, Toman',
    /** Footnote for the CURRENT-only placement (homepage two-up row). */
    boardFootnoteCurrent: 'Current price — TGJU open market, Toman',
    /* Gold & coins panel (2026-09-27) — the second LED box: the global
     * ounce in USD plus the Tehran gold market in Toman, TGJU's own quotes. */
    goldAriaLabel: 'Gold and coins board — global ounce in USD, Tehran market in Toman',
    goldBoardTitle: 'Gold & Coins',
    /** Silkscreen column label over the item names (like CURRENCY). */
    goldItem: 'Item',
    /** Divider label marking the Tehran market section + its unit. */
    goldDomestic: 'Tehran Market · Toman',
    goldUnitUsd: 'USD',
    goldUnitToman: 'Toman',
    goldFootnote: 'Global ounce in USD, Tehran market in Toman — TGJU real quotes: current · day high · day low · change %',
    /** Footnote for the CURRENT-only placement (homepage two-up row). */
    goldFootnoteCurrent: 'Global ounce in USD, Tehran market in Toman — TGJU real quotes: current · change %',
    detailsSection: 'Details & trends',
  },

  trend: {
    /** Shown above a sparkline; {n} = number of recorded updates. */
    recentChecks: 'Trend — last {n} updates',
    /** Screen-reader summary: {pair} like 'USD → IRR', {dir} up/down/flat, {pct} signed %. */
    summary: '{pair} trend over recent updates: {dir} {pct}',
    up: 'up',
    down: 'down',
    flat: 'flat',
    /** Hint under the converter sparkline. */
    honestNote: 'From recorded live-rate updates — recent window, not full market history.',
    /** Min/max caption; {min} and {max} are formatted rates. */
    range: 'low {min} · high {max}',
  },

  calculator: {
    title: 'Calculator',
    subtitle: 'Calculate and convert currencies',
    inputCurrency: 'Input Currency',
    convertTo: 'Convert To',
    convertInfo: 'Calculations are performed in {from} and converted to {to}',
    error: 'Error',
    rateUnavailable: 'Rate unavailable',
  },

  history: {
    title: 'Conversion History',
    noConversionsYet: 'No History Yet',
    emptyHint: 'Your conversion history will appear here',
    clearHistory: '🗑️ Clear History',
    clearConfirm: 'Are you sure you want to clear all history?',
    searchPlaceholder: 'Search currency or amount…',
    filterAll: 'All',
    totalConversions: 'Conversions',
    uniquePairs: 'Currency pairs',
    mostUsed: 'Most used',
    lastConversion: 'Last conversion',
    repeat: 'Repeat',
    repeatTitle: 'Convert again at today’s rate',
    deleteEntry: 'Delete entry',
    exportCsv: 'Export CSV',
    exported: '✅ CSV exported!',
    noResults: 'No conversions match your filters.',
    clearFilters: 'Clear filters',
  },

  receipt: {
    title: 'Receipt Generator',
    subtitle: 'Track your daily expenses and generate professional receipts',
    travelCurrency: '🌎 Travel Currency',
    expenseDetails: '💰 Expense Details',
    fromCurrency: 'From Currency',
    toCurrency: 'To Currency',
    receiptDate: 'Receipt Date',
    additionalOptions: '⚙️ Additional Options',
    multiDayReceipt: '📅 Multi-Day Receipt',
    endDate: 'End Date',
    differentCurrencyPerItem: '💱 Different Currency Per Item',
    addTimeToItems: '⏰ Add Time to Items',
    budgetTracking: '💳 Budget Tracking',
    dailyBudget: 'Daily Budget',
    budgetPlaceholder: 'Enter budget amount',
    splitExpenses: '👥 Split Expenses',
    numberOfPeople: 'Number of People',
    expenseItems: '📋 Expense Items',
    addExpense: 'Add Expense',
    amountPlaceholder: 'Amount',
    notesPlaceholder: 'Notes (optional)',
    budget: 'Budget',
    remaining: 'Remaining',
    perPerson: 'Per Person',
    generate: '📄 Generate',
    downloadPdf: '📕 Download PDF',
    downloadImage: '🖼️ Image',
    downloadExcel: '📊 Excel',
    creating: 'Creating...',
    pdfCreating: '⏳ Creating PDF...',
    downloaded: '✅ Downloaded!',
    exportFailed: '❌ Export failed. Please try again.',
    clearConfirm: 'Clear all expenses?',
    expenseReceipt: '🧾 EXPENSE RECEIPT',
    generatedAt: 'Generated:',
    receiptId: 'Receipt ID:',
    convertedAmount: '💱 Converted Amount',
    totalLabel: 'TOTAL',
    addAtLeastOneExpense: '⚠️ Please add at least one expense',
    generateFirst: '⚠️ Please generate a receipt first',
    /* Share/export copy (BACKLOG #27): these paths had left the dictionary —
     * fa users got English share text, Excel headers and Latin digits. */
    shareTitle: 'Expense Receipt',
    shareTotalLabel: '💰 TOTAL:',
    shareConvertedLabel: '💱 Converted:',
    shareRateLabel: '📊 Rate:',
    excelSheetName: 'Receipt',
    excelHeading: 'EXPENSE RECEIPT',
    excelCategory: 'Category',
    excelNotes: 'Notes',
    categories: {
      transport: '🚕 Transportation',
      food: '🍔 Food/Meals',
      groceries: '🛒 Groceries',
      tickets: '🎫 Tickets',
      snacks: '🍿 Snacks',
      drinks: '🥤 Drinks',
      custom: '✏️ Custom',
    },
  },

  expenseSplitter: {
    title: 'Expense Splitter',
    totalExpenseAmount: 'Total Expense Amount',
    totalPlaceholder: 'e.g., 300',
    amountCurrency: 'Amount Currency',
    numberOfPeople: 'Number of People',
    showInSecondCurrency: 'Show in Second Currency',
    secondCurrency: 'Second Currency',
    splitExpense: '💸 Split Expense',
    splitResults: 'Split Results',
    totalAmount: 'Total Amount:',
    eachPersonPays: 'Each Person Pays:',
    breakdown: 'Breakdown:',
    personLabel: 'Person {n}',
    rateLabel: 'Rate: 1 {from} = {rate} {to}',
    conversionFailed: 'Conversion failed',
    networkError: 'Network error',
    validTotal: 'Please enter a valid total amount',
    validPeople: 'Please enter a valid number of people',
  },

  splitSettle: {
    title: 'Split & Settle',
    subtitle: 'Track shared expenses and settle debts easily',
    noGroupsYet: 'No Groups Yet',
    noGroupsText: 'Create your first group to start tracking shared expenses with friends and family',
    createFirstGroup: '➕ Create First Group',
    members: 'Members',
    expenses: 'Expenses',
    membersCount: '{n} members',
    expensesCount: '{n} expenses',
    youAreOwed: 'You are owed {n}',
    youOwe: 'You owe {n}',
    allSettledUp: 'All settled up ✅',
    allSettledCelebration: 'All settled up!',
    expensesTab: '💰 Expenses',
    balancesTab: '📊 Balances',
    settleTab: '✅ Settle',
    noExpensesYet: 'No expenses yet. Add your first expense!',
    createNewGroup: 'Create New Group',
    createGroup: 'Create Group',
    groupName: 'Group Name',
    groupNamePlaceholder: 'e.g., Dubai Trip 2025',
    chooseEmoji: 'Choose an Emoji',
    membersLabel: 'Members (comma separated)',
    membersPlaceholder: 'Ali, Sara, Hassan',
    youAddedAutomatically: "You'll be added automatically",
    addExpense: 'Add Expense',
    descriptionPlaceholder: 'e.g., Hotel booking',
    amountPlaceholder: '0.00',
    paidBy: 'Paid by',
    splitBetween: 'Split between',
    receiptPhotoOptional: 'Receipt Photo (Optional)',
    clickToAddPhoto: 'Click to add photo',
    removePhoto: 'Remove photo',
    expensePhoto: 'Receipt photo',
    settle: '✓ Settle',
    markSettledConfirm: 'Mark this payment as settled?',
    paymentMarkedSettled: '✅ Payment marked as settled!',
    backToGroups: '← Back to Groups',
    settlementLabel: 'Settlement: {from} → {to}',
    deleteGroup: 'Delete Group',
    deleteGroupConfirm: 'Delete this group and all its expenses?',
    groupDeleted: '🗑️ Group deleted',
    enterGroupName: 'Please enter a group name',
    enterDescription: 'Please enter a description',
    enterValidAmount: 'Please enter a valid amount',
    selectOnePerson: 'Please select at least one person to split with',
  },


  batchConverter: {
    title: '🛒 Batch Converter',
    subtitle: 'Convert multiple prices at once - perfect for online shopping!',
    currencySelection: '💱 Currency Selection',
    quickTemplates: '📋 Quick Templates:',
    templateShopping: '🛍️ Shopping Cart (5 items)',
    templateComparison: '📊 Price Comparison (3 items)',
    templateWishlist: '⭐ Wishlist (10 items)',
    enterAmounts: '💵 Enter Amounts',
    bulkInput: '📝 Bulk Input (Fast)',
    withNotes: '📝 With Notes',
    bulkPlaceholder: 'Enter amounts, one per line:',
    bulkHint: '💡 Tip: Just paste prices, one per line. The currency you selected above will be used.',
    amountFieldPlaceholder: 'Enter amount (e.g., 4556.50)',
    noteFieldPlaceholder: '📝 Add note (e.g., iPhone 15 Pro, Black, 256GB)',
    addAnotherAmount: '➕ Add Another Amount',
    convertAllPrices: '🔄 Convert All Prices',
    convertedPrices: '📋 Converted Prices',
    resultsPlaceholder: 'Enter your amounts and hit convert — the full price breakdown will appear here.',
    totalItems: 'Total Items',
    totalCost: 'Total Cost',
    convertedTotal: 'Converted Total',
    copyAll: '📋 Copy All',
    exportCsv: '📊 Export CSV',
    convertingPrices: 'Converting prices...',
    enterAtLeastOne: '⚠️ Please enter at least one amount',
    selectDifferent: '⚠️ Please select different currencies',
    notePlaceholder: 'Note (optional)',
    invalidLine: '⚠️ Invalid line',
    invalidLinesSummary: '{n} line(s) skipped',
    conversionFailed: '❌ Conversion failed. Please check your connection and try again.',
    copiedToast: '📋 Copied to clipboard! You can paste it anywhere.',
    downloaded: '✅ Downloaded!',
    /* Share-text labels (BACKLOG #27) — the shared/copyable summary had
     * left the dictionary (fa users got English labels). */
    shareHeading: '🛒 Batch Currency Conversion',
    shareRateLabel: 'Rate:',
    shareTotalLabel: 'Total:',
    shareConvertedLabel: 'Converted:',
    /** Universal example lines for the bulk-input placeholder (digits and
     *  currency codes are locale-neutral; the label itself is the
     *  bulkPlaceholder key above). */
    bulkPlaceholderExamples: '4556\n4545\n3443.50\n2199.99\n\n100 usd eur\n150.99 USD | iPhone 15 Pro',
  },

  about: {
    title: 'About Currena',
    /* Trust & legal sections (owner request 2026-09-20: baseline trust
     * signals for a financial utility) — linked from the site-wide footer.
     * Honest and short: client-only app, device-local storage, public rate
     * sources, no accounts/analytics/cookies. */
    privacyTitle: '🔒 Privacy Policy',
    privacyText1:
      'Currena runs entirely in your browser. Your conversion history, recent pairs, receipts, groups and settings are stored only on your device (browser localStorage) — they never leave it, and clearing your browser data removes them permanently.',
    privacyText2:
      'We set no cookies, run no analytics or tracking, and require no account. Exchange rates are fetched from public sources (TGJU and Frankfurter); the app sends them only the minimum needed to serve a quote.',
    termsTitle: '📜 Terms of Service',
    termsText1:
      'Currena provides exchange-rate information for convenience only. Open-market rates change continuously and may differ from the rate you actually get; nothing in the app is financial advice.',
    termsText2:
      'Use the app at your own discretion. Generated receipts and expense splits are your own records — verify amounts before relying on them.',
    contactTitle: '✉️ Contact',
    contactText: 'Questions, feedback or bug reports are welcome — reach the developer on GitHub:',
    aboutText1:
      'Currena is a currency conversion application designed to help you navigate financial decisions with ease. Built with Iranians in mind, it addresses the challenges of currency volatility, especially for the Iranian Toman.',
    featureTravel: 'Perfect for travel to Turkey, UAE, and beyond',
    featureImmigration: 'Plan your immigration to Australia, Canada, and other destinations',
    featureRates: 'Real-time exchange rates from trusted sources',
    featureOffline: 'Offline support with cached rates',
    featureMental: 'Reduces mental strain in financial planning',
    aboutText2:
      "Whether you're traveling, immigrating, or simply managing international finances, Currena simplifies currency conversion and helps you make informed decisions.",
  },

  errors: {
    unableToFetchRate: 'Unable to fetch exchange rate. Please try again.',
    noInternetNoCache:
      'No internet connection and no cached data available. Please connect to internet at least once.',
    pairNotSupported: 'This currency pair is not supported by the rate source.',
  },

  /** Insights page — only the route title lives here; the full copy corpus
   * (28 indicators × 6 fields, both locales) is code-split with the lazy
   * /insights route chunk in i18n/insights-copy-en.ts / -fa.ts so the entry
   * bundle does not regress (roadmap Phase I4 perf constraint). */
  insights: {
    title: 'Insights',
  },

  footer: {
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
  },

  /** Jalali month names — legacy renders English transliterations (jalaali-js) */
  jalaliMonths: [
    'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
    'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand',
  ] as readonly string[],
};

export type Dictionary = typeof en;
