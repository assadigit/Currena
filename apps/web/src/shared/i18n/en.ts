/**
 * English dictionary: SOURCE OF TRUTH.
 * Every string extracted verbatim from the legacy Django templates
 * (Phase 1; the historical feature inventory was removed in the
 * 2026-10-28 tidy-up — git history is the backup). fa.ts must satisfy
 * this shape. New strings are added HERE first, then translated.
 */
export const en = {
  app: {
    name: 'Currena',
    tagline: 'Real-time rates, easy conversion', // legacy About tagline (fa original: نرخ ارز لحظه‌ای، تبدیل آسان)
    /* S19 (2026-11-12): the app-wide default meta/OG description — the
       whole product in one sentence (the world scan + the destinations
       + the Toman converter). The static index.html + the PWA manifest
       carry the same wording; the per-route pass overrides it with each
       destination's own purpose line. */
    metaDescription: "The world's economy at a glance: the gold conditions meter, world markets, regional gauges, commodities, FX rule lights, and the live Iranian Toman converter.",
    versionLabel: 'Version {version}',
    madeBy: 'Made with ❤️ by Ali Assadi',
    createdBy: 'Created by',
    creatorName: 'Ali Assadi',
    errorTitle: 'Something went wrong',
    errorText: 'This page hit an unexpected error. Your data is safe. Try again, or head back to the converter.',
    errorRetry: 'Try again',
    errorHome: 'Go to converter',
  },

  nav: {
    home: 'Home',
    /* S19 (2026-11-12): the breadcrumb row's nav aria-label. */
    breadcrumb: 'Breadcrumb',
    skipToContent: 'Skip to main content',
    receiptGenerator: 'Receipt Generator',
    calculator: 'Calculator',
    liveRates: 'Live Rates',
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
    /* S19 (2026-11-12): the language quick-toggle's label now NAMES THE
       TARGET (the HANDOFF item 6 polish — the button shows the target
       language's own word 'فا'/'EN' visibly; the accessible name says
       what clicking does, in the CURRENT locale's language). */
    switchToFa: 'Switch to Farsi',
    switchToEn: 'Switch to English',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
    toggleTheme: 'Toggle theme',
    menu: 'Menu',
    installApp: 'Install app',
    /* ── Page-division S1 (D-45/D-46): the grouped topbar's market
       destinations + the converter's new home. */
    global: 'Global',
    gold: 'Gold',
    worldMarkets: 'World Markets',
    currencies: 'Currencies',
    commodities: 'Commodities',
    regions: 'Regions',
    usa: 'USA',
    europe: 'Europe',
    asiaPacific: 'Asia & Pacific',
    australia: 'Australia',
    economicLinkages: 'Linkages',
    tools: 'Tools',
    converter: 'Converter',
    marketsGroup: 'Markets',
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
    offlineRatesFrom: 'Offline: showing rates from {source}',
    currencyGroupIranian: 'Iranian Toman',
    currencyGroupInternational: 'International Currencies',
    delete: 'Delete',
    people: 'People',
    noChange: 'no change',
    na: 'n/a',
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
    boardAtAGlance: 'Iranian Toman: at a glance',
    quickTools: 'Quick tools',
    /** I11: the always-on rate line under the currency row. */
    liveRate: 'Live rate',
    updatedAgo: 'Updated {ago}',
    copyRate: 'Copy rate',
    rateCopied: 'Copied!',
    popularPairs: 'Popular pairs',
    /** I12: the failure card's retry affordance. */
    tryAgain: 'Try again',
    /** I12: neutral title for SERVER-side failures (no "check your connection"). */
    conversionFailedServer: 'Conversion failed: give it a moment',
  },

  /** I14: rate alerts: watch a pair, get told when it crosses a target. */
  alerts: {
    sectionTitle: 'Rate alerts',
    sectionHint: 'Watch a target rate',
    openDialog: 'Rate alerts',
    title: 'Rate alerts',
    shortcut: 'A',
    direction: 'Direction',
    above: 'Rises above',
    below: 'Falls below',
    threshold: 'Target rate',
    currentRateLabel: 'Current rate:',
    add: 'Add alert',
    remove: 'Delete alert',
    empty: 'No alerts yet: pick a pair, set a target rate, and Currena will watch the market for you.',
    capReached: 'You can keep up to {max} alerts. Delete one to add another.',
    waiting: 'Waiting · now {rate}',
    triggered: 'Triggered at {rate}',
    firedToast: '🔔 {pair} just crossed {threshold}',
    firedMore: '+{count} more alert(s) fired',
    honestNote: 'Alerts are checked only while Currena is open; there are no background notifications.',
    invalidThreshold: 'Enter a target rate above 0',
    sameCurrency: 'Pick two different currencies',
    badge: '{count} triggered',
    waitingCount: '{count} waiting',
    from: 'From',
    to: 'To',
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

  /* Gold & coins LED panel (2026-09-27): TGJU's طلا و سکه market items:
   * global ounce in USD, Tehran market in Toman (÷10 converted from
   * TGJU's printed Rial: owner request 2026-09-19). Keys mirror core's
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
    'gold-mesghal': 'Mesghal', // GPE R13: the bridge board's melt-gold row
  },

  liveRates: {
    title: 'Live Rates',
    /* Per-board headings (owner request 2026-09-28): each LED board now
     * carries its own emoji-marked title + a live-source pill hyperlinked
     * to TGJU + the last-updated stamp: replacing the single page
     * header. */
    currencyBoardHeading: 'Currency Rate Board: Toman',
    goldBoardHeading: 'Gold Rate Board: Toman',
    liveFromTgju: 'Live updates from TGJU',
    couldNotFetch: '⚠️ Could not fetch rates. Please check your connection.',
    refresh: 'Refresh Rates',
    copyRate: 'Copy rate',
    rateCopied: '✅ Rate copied!',
    noChangeSincePrevious: 'No change since the previous update',
    changedSincePrevious: 'Change since the previous update',
    /* LED shopfront board (2026-09-18): the dark panel that recreates a
     * currency-exchange window display. Columns show TGJU's actual daily
     * stats (2026-09-26): current price, day high, day low: real data,
     * never a derived dealer spread. */
    boardAriaLabel: 'Exchange rate board: current, day-high and day-low Toman rates per currency',
    boardCurrent: 'CURRENT',
    boardHigh: 'DAY HIGH',
    boardLow: 'DAY LOW',
    boardCurrency: 'CURRENCY',
    boardUnitToman: 'Toman',
    boardLive: 'LIVE',
    boardCached: 'CACHED',
    boardOffline: 'OFFLINE',
    /** Per-board footnote: the three columns are TGJU's own daily stats. */
    boardFootnote: 'Current · day high · day low: TGJU open market, Toman',
    /** Footnote for the CURRENT-only placement (homepage two-up row). */
    boardFootnoteCurrent: 'Current price: TGJU open market, Toman',
    /* Gold & coins panel (2026-09-27): the second LED box: the global
     * ounce in USD plus the Tehran gold market in Toman, TGJU's own quotes. */
    goldAriaLabel: 'Gold and coins board: global ounce in USD, Tehran market in Toman',
    goldBoardTitle: 'Gold & Coins',
    /** Silkscreen column label over the item names (like CURRENCY). */
    goldItem: 'Item',
    /** Divider label marking the Tehran market section + its unit. */
    goldDomestic: 'Tehran Market · Toman',
    goldUnitUsd: 'USD',
    goldUnitToman: 'Toman',
    goldFootnote: 'Global ounce in USD, Tehran market in Toman. TGJU real quotes: current · day high · day low · change %',
    /** Footnote for the CURRENT-only placement (homepage two-up row). */
    goldFootnoteCurrent: 'Global ounce in USD, Tehran market in Toman. TGJU real quotes: current · change %',
    detailsSection: 'Details & trends',
  },

  trend: {
    /** Shown above a sparkline; {n} = number of recorded updates. */
    recentChecks: 'Trend: last {n} updates',
    /** Screen-reader summary: {pair} like 'USD → IRR', {dir} up/down/flat, {pct} signed %. */
    summary: '{pair} trend over recent updates: {dir} {pct}',
    up: 'up',
    down: 'down',
    flat: 'flat',
    /** Hint under the converter sparkline. */
    honestNote: 'From recorded live-rate updates: recent window, not full market history.',
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
    /* Share/export copy (BACKLOG #27): these paths had left the dictionary :
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
    /** A11y (audit WS-3 #3): the stepper's − button — a real verb, not a glyph. */
    removePerson: 'Remove one person',
    /** A11y (audit WS-3 #3): the stepper's + button. */
    addPerson: 'Add one person',
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
    subtitle: 'Convert multiple prices at once, perfect for online shopping!',
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
    resultsPlaceholder: 'Enter your amounts and hit convert: the full price breakdown will appear here.',
    totalItems: 'Total Items',
    totalCost: 'Total Cost',
    convertedTotal: 'Converted Total',
    copyAll: '📋 Copy All',
    exportCsv: '📊 Export CSV',
    /** A11y (audit WS-3 #4): the Web Share sheet's title (was hardcoded EN). */
    shareTitle: 'Batch Currency Conversion',
    convertingPrices: 'Converting prices...',
    enterAtLeastOne: '⚠️ Please enter at least one amount',
    selectDifferent: '⚠️ Please select different currencies',
    // I13 (BACKLOG #32): input-bound toasts for pathological pastes.
    tooManyLines: '⚠️ Too many lines: please keep it under 500',
    lineTooLong: '⚠️ One line is too long: please keep lines under 500 characters',
    notePlaceholder: 'Note (optional)',
    invalidLine: '⚠️ Invalid line',
    invalidLinesSummary: '{n} line(s) skipped',
    conversionFailed: '❌ Conversion failed. Please check your connection and try again.',
    copiedToast: '📋 Copied to clipboard! You can paste it anywhere.',
    downloaded: '✅ Downloaded!',
    /* Share-text labels (BACKLOG #27): the shared/copyable summary had
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
     * signals for a financial utility): linked from the site-wide footer.
     * Honest and short: client-only app, device-local storage, public rate
     * sources, no accounts/analytics/cookies. */
    privacyTitle: '🔒 Privacy Policy',
    privacyText1:
      'Currena runs entirely in your browser. Your conversion history, recent pairs, receipts, groups and settings are stored only on your device (browser localStorage): they never leave it, and clearing your browser data removes them permanently.',
    privacyText2:
      'We set no cookies, run no analytics or tracking, and require no account. Exchange rates are fetched from public sources (TGJU and Frankfurter); the app sends them only the minimum needed to serve a quote.',
    termsTitle: '📜 Terms of Service',
    termsText1:
      'Currena provides exchange-rate information for convenience only. Open-market rates change continuously and may differ from the rate you actually get; nothing in the app is financial advice.',
    termsText2:
      'Use the app at your own discretion. Generated receipts and expense splits are your own records: verify amounts before relying on them.',
    contactTitle: '✉️ Contact',
    contactText: 'Questions, feedback or bug reports are welcome: reach the developer on GitHub:',
    aboutText1:
      'Currena is a currency converter built to make everyday money decisions easier. Designed with Iranians in mind, it addresses the challenge of currency volatility, especially for the Iranian Toman.',
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
      'No internet connection and no cached data available. Please connect to the internet at least once.',
    pairNotSupported: 'This currency pair is not supported by the rate source.',
    /** I12: honest server-vs-network failure copy (2026-10-07 incident:
     *  telling users to "check your connection" while the API 500'd was
     *  misleading: their network was fine). */
    serverTemporarilyUnavailable: 'The rate service is temporarily unavailable.',
    retryingAutomatically: 'Retrying automatically: this usually resolves within a minute.',
    cantReachServer: 'Could not reach the rate service.',
    /** Live countdown under the failure card; {seconds} is localized digits. */
    retryingIn: 'Retrying in {seconds}s',
  },

  /** Page-division S1 (2026-11-07): the destination placeholders' copy —
   * titles, purposes, membership summaries and the migration bridge. The
   * per-page content itself arrives with each page's build session
   * (roadmap S3–S18) in the insights-copy corpora; this section is the
   * honest skeleton only. */
  pd: {
    statusBuilding: 'In build',
    buildsIn: 'Planned — builds in roadmap sessions {sessions}.',
    decisionsLabel: 'Decision record',
    whatLivesHere: 'What will live here',
    backToGlobal: 'Back to the Global scan',
    unknownRoute: 'This destination is not part of the current program.',
    global: {
      title: 'Global',
      purpose: 'The one-screen answer to “how is the world’s economy doing right now?” — for people who scan fast.',
      summary:
        'A 10-tile verdict board — gold balance, the five thematic gauges, FX lights, world markets status, a live prices ribbon and the dedollarization context — plus region chips and a one-line “what changed today” narrator. Zero scrolling.',
      destinations: 'The destinations',
      /* ---- S3 (2026-11-08): the verdict board's own copy (D-21…D-25).
       * The verdict WORDS below are pinned byte-for-byte to the insights
       * copy corpus (label / verdictStateNames / status / markets verdict
       * words) by global-copy-pin.test.ts — the Global page speaks the
       * engine's own language, never a parallel vocabulary. */
      boardAria: 'The world scan — ten verdict tiles',
      loadingLine: 'Reading the world’s gauges…',
      errorTitle: 'The world scan is unavailable right now',
      errorText: 'The data did not arrive. Nothing is shown rather than a guess.',
      errorRetry: 'Try again',
      fromCache: 'Showing the last good copy — data as of {date}',
      /* S4 (M-17): the board tiles' own cached caption — speaks only when
       * the tile renders the cached copy (the boot paint or the outage
       * path), with the board's own stored date. */
      boardCached: 'Last good copy · {time}',
      dataAsOf: 'Data as of {date}',
      pricesAsOf: 'Live prices as of {time}',
      /* GPE R06/#23 (GPE-S2-23): the cached-outage qualifier — when the
       * projection rendering is the last-good copy (a live-prices refresh
       * is failing), the live-prices line states the timestamp is the
       * "last successful" read, never reading a stale clock as "current".
       * {time} is the same formatted UTC HH:MM the fresh line carries. */
      pricesAsOfLastSuccessful: 'Live prices (last successful) as of {time}',
      absentLine: '{n} of this page’s readings are not published in this mode.',
      /* GPE R05 (S4-D1, the CPI shutdown-gap policy): the point-of-use
       * method label for a YoY reading whose prior-year base month was
       * missing upstream — the value is computed against the average of
       * the two adjacent published months (the disclosed, reproducible
       * method; the flag auto-expires when the base month returns).
       * {month} is the missing BASE month (the observation month minus
       * one year), formatted in the page's calendar. Rendered wherever
       * the reading's value shows (the gold meter's CPI seat + the USA
       * CPI card). */
      yoyGapBaseLabel: 'base: adjacent-months average ({month} publication gap)',
      /* Tile titles (D-21's own names, spec §4). */
      tileGoldBalance: 'Gold Balance',
      tileBorrowingCosts: 'Borrowing Costs',
      tileInflationHeat: 'Inflation Heat',
      tileMarketStress: 'Market Stress',
      tileDollarStrength: 'Dollar Strength',
      tileGrowthHealth: 'Growth Health',
      tileFxLights: 'FX Lights',
      tileWorldMarkets: 'World Markets',
      tilePricesRibbon: 'Prices',
      tileDedollar: 'Dedollarization',
      /* The four gauge verdict words (pinned to insights copy.label). */
      labelRelaxed: 'Stable',
      labelCautious: 'Cautious',
      labelStressed: 'Stressed',
      labelAlarmed: 'Critical',
      cannotRead: 'Cannot read yet',
      /* One gauge tile's why-line (computed from the engine's counts). */
      gaugeWhySome: '{warnings} of {voters} voters need attention',
      gaugeWhyNone: 'No voter needs attention',
      gaugeWhyUnread: 'Not enough readable voters',
      /* The Gold Balance tile (D-21): outlook state + the meter's counts.
       * GPE R08 / F15 (2026-11-18, s6/02 §C3 clause 1): the label re-scopes
       * to CONDITIONS — the line never reads "Gold outlook" (the market's
       * word survives on the state names); clause 2 adds the inline
       * no-forecast caveat beside the outlook word. */
      goldOutlookLabel: 'Conditions outlook',
      outlookCaveat: 'this describes current conditions, not a forecast',
      goldCounts: '{for} for · {against} against',
      goldUnread: ' · {n} unread',
      /* The 7-state outlook names (pinned to insights signals.verdictStateNames). */
      outlookStrongBullish: 'Strong bullish',
      outlookBullish: 'Bullish',
      outlookNeutral: 'Neutral',
      outlookRangeBound: 'Range-bound',
      outlookBearish: 'Bearish',
      outlookStrongBearish: 'Strong bearish',
      outlookMixed: 'Mixed signals',
      /* The FX Lights tile (D-21). Signal words pinned to insights status. */
      fxSignalNormal: 'Normal',
      fxSignalAttention: 'Needs attention',
      fxSignalUnusual: 'Unusual',
      fxActive: '{n} of {total} rules active',
      fxNoneActive: 'No rule active',
      /* The World Markets tile (D-21). Words pinned to insights markets verdicts. */
      marketsBullish: 'Bullish',
      marketsMixed: 'Mixed',
      marketsBearish: 'Bearish',
      marketsInCorrection: '{n} of {total} in correction',
      marketsInBear: ' · {n} in a bear market',
      /* The prices ribbon (D-22): gold · brent · BTC, live hourly. S4
       * (BD-S4a): every change carries its VISIBLE window tag — the true
       * day change when the live entry provides change1d, else the
       * labelled 7-day change. */
      ribbonGold: 'Gold',
      ribbonBrent: 'Brent',
      ribbonBtc: 'Bitcoin',
      unitUsd: 'US$',
      ribbonWindowTag: '{days}d',
      changeOver1d: 'over the past day',
      changeOver: 'over the past {days} days',
      ribbonUnavailable: 'Unavailable',
      /* The dedollarization context tile (D-25, display-only). */
      dedollarShareLabel: 'USD share of world FX reserves',
      dedollarCustodyLabel: 'Foreign holdings at the NY Fed',
      dedollarDirection: '{change} over 30 days',
      dedollarNote: 'Context only — no verdict',
      /* The region chips (D-23). */
      chipsAria: 'The destinations',
      dotCalm: 'Calm',
      dotWatch: 'Watch',
      dotNoVerdict: 'No verdict at this layer yet',
      /* The narrator line (D-24). S4 (BD-S4b): the text renders verbatim;
       * the line carries the unit's own freshness stamp (the legacy
       * NarrativeBlock's "Updated {time}" discipline). */
      narratorTitle: 'What changed today',
      narratorUpdated: 'Updated {time}',
      narratorUpdatedToday: 'today',
    },
    gold: {
      title: 'Gold',
      purpose: 'THE gold card — the 37-voter conditions meter plus the complete gold picture.',
      summary:
        'A live gold-price hero with the Balance Scale verdict and 7-state outlook, the 37 voter seats grouped by their five lanes, 14 ratio & flow context cards, and the honest-record footnote.',
      /* ---- S5 (2026-11-08): the Gold page's own copy (D-26…D-29). The
       * verdict WORDS below are pinned byte-for-byte to the insights copy
       * corpus (signals.balance / signals.goldScore / indicators / units /
       * status / ui) by gold-copy-pin.test.ts — the Gold page speaks the
       * engine's own language, never a parallel vocabulary. Generic page
       * words (dataAsOf · pricesAsOf · fromCache · absentLine · cannotRead ·
       * the outlook names) REUSE pd.global's own pinned keys. */
      loadingLine: 'Reading the gold meter…',
      errorTitle: 'The gold page is unavailable right now',
      errorText: 'The data did not arrive. Nothing is shown rather than a guess.',
      errorRetry: 'Try again',
      /* The hero (D-26 item 1) — the balance heading + subtitle, the
       * verdict eyebrow + words, the counts parts, the beam's aria and
       * gold's own 30-day context line: all pinned to the corpus. */
      heroHeading: 'The aggregate of factors affecting the price of gold',
      heroSubtitle:
        'Gold’s five main drivers are each read against their usual range and weighed equally. The beam shows today’s lean. It is not a forecast.',
      heroVerdictEyebrow: 'Today’s lean',
      heroVerdictFor: 'Leaning for gold',
      heroVerdictBalanced: 'Balanced',
      heroVerdictAgainst: 'Leaning against gold',
      heroVerdictNone: "Can't read the conditions right now",
      heroNotEnough: 'Not enough readable conditions to weigh',
      heroBeamAria: 'Beam tilt: {n}°, {verdict}.',
      heroCountFor: '{n} for',
      heroCountAgainst: '{n} against',
      heroCountNotLeaning: '{n} not leaning',
      heroCountUnread: '{n} unread',
      heroContextLine: 'Gold over the last 30 days: {change}. Shown for context, not counted in the balance.',
      heroChange30d: '30-day speed',
      heroPositionLine: '{band} of the last 10 years',
      bandTop: 'top {p}%',
      bandMid: 'the middle',
      bandBottom: 'bottom {p}%',
      /* ---- S6 (BD-S6a): the hero's balance-view ALTERNATION — the
       * previous brass balance shape (smaller) beside the S5 minimal
       * glyph. The view words are fresh UI copy; every stage + tray
       * word below is pinned byte-for-byte to the insights corpus
       * (signals.balance / conditionStateShort) by gold-copy-pin.test.ts,
       * so the classic drawing speaks the SAME words as the legacy card. */
      heroViewLabel: 'Balance view',
      heroViewClassic: 'The balance',
      heroViewMinimal: 'Minimal',
      stageSideFor: 'Factors supporting gold’s price',
      stageSideAgainst: 'Factors pressuring gold’s price',
      stageEmptyFor: 'None of the factors checked shows a meaningful signal supporting gold’s price right now.',
      stageEmptyAgainst: 'None of the factors checked shows a meaningful signal working against gold’s price right now.',
      stageEmptyNone: 'Nothing could be read yet, so neither side has been weighed.',
      stageAria: 'Balance for gold: {summary}. {verdict}.',
      stageCountFor: '{n} for',
      stageCountAgainst: '{n} against',
      stageCountNeutral: '{n} neutral',
      stageCountUnread: "{n} couldn't be read",
      laneChipAria: '{lane}: {side}. {tally}.',
      splitBadge: 'Split',
      stateShortSupportive: 'Supports',
      stateShortAgainst: 'Works against',
      stateShortNeutral: 'Sitting neutral',
      stateShortUnknown: 'Cannot read',
      trayTitle: 'Not leaning',
      trayNote: 'Weighed, but no clear lean',
      trayEmpty: 'Every driver is on a pan.',
      /* The five lanes (D-26 item 2) — names, intros, state words and
       * tallies pinned to the corpus's own lane dictionaries. */
      seatsAria: 'The gold meter’s five lanes and 37 voter seats',
      lanesTitle: 'The 37 seats, by lane',
      seatSupports: 'Supports gold',
      seatPressures: 'Pressures gold',
      seatSteady: 'Not leaning',
      seatUnread: 'Couldn’t be read',
      /* GPE R04 (F16a, wave 0): the why-unread lines — one muted status
       * line per dark seat, its cause class from the S2 §3 decomposition
       * (upstream-stopped / upstream-gap / pipeline-lag / rule-driven).
       * The {month} is the reading's own asOf, formatted in the page's
       * locale (Jalali in fa). Rendered ONLY under a dark seat; the
       * moment a seat lights, its line stops rendering. */
      seatWhyUpstreamStopped: 'source stopped publishing — last data {month}',
      seatWhyUpstreamGap: 'upstream did not publish the year-ago base month (publication gap)',
      seatWhyPipelineLag: 'data published upstream — the next ingest will carry it',
      seatWhyRuleDriven: 'value is current; no decile history for this seat yet',
      /* GPE R11 / F1 (2026-11-18, s7/03 §2 — the binding rules): the daily
       * narrative's copy. The price fact is the TE pattern (the move +
       * context windows, series + as-of named — C1); the family lines
       * reuse the seats' OWN lane keys (byte-identical counts — the
       * one-projection rule §2.4); the caveat is standing and adjacent
       * (C7 rule 2); "coincided with", never "because" — the component
       * composes co-movement, never causation. */
      narrativeTitle: 'Why gold moved',
      narrativePriceFact: 'Gold moved {windows} ({series}, as of {date}).',
      narrativePriceJoin: '{a} and {b}',
      narrativeWindow1d: '{v} over the past day',
      narrativeWindow30d: '{v} over the past 30 days',
      narrativeWindow90d: '{v} over the past 90 days',
      narrativePriceMissing: 'The live gold price could not be read yet.',
      narrativeMover: '{name} {delta} over the past 30 days',
      narrativeDeltaPts: '{v} pts',
      narrativeDeltaPct: '{v}%',
      narrativeCaveat: 'The meter explains conditions, not the price move',
      /* GPE R12 / F5 (2026-11-18, s7/01 §4 Chain 3 + s7/02 §2.4's approved
       * leg glosses): the yield-decomposition card. The exact relation
       * rendered is real + breakeven = nominal (the breakeven derived);
       * the term premium is the ACM model's estimate — its provenance +
       * revision disclosure ride the leg (Idea 5's risk note, binding).
       * The three named configurations + the funding-stress exception
       * are the card's static education copy (dated examples, no live
       * verdict). The moved line + the delta units REUSE the narrative's
       * own keys (C7: no parallel copy). */
      yieldTitle: 'The 10-year yield, decomposed',
      yieldIdentity: 'real {real} + breakeven {be} = nominal {nominal} (the breakeven is derived: nominal − real)',
      yieldMovedTitle: 'Which piece moved this month',
      yieldLegNominal: 'Nominal 10-year',
      yieldLegReal: 'Real 10-year',
      yieldLegBreakeven: 'Breakeven',
      yieldLegPremium: 'Term premium',
      yieldGlossNominal: 'The Treasury’s plain interest rate — the headline number.',
      yieldGlossReal: 'The nominal rate minus expected inflation — what a saver actually earns; gold’s classic rival.',
      yieldGlossBreakeven: 'The inflation the market prices into the gap — expected inflation, read off the yield curve.',
      yieldGlossPremium:
        'The extra yield lenders demand for holding long — the fear-and-supply compensation; when this piece lifts the yield, history has supported, not hurt, gold.',
      yieldAsOf: 'as of {date}',
      yieldPremiumNote: 'The term premium is a model estimate (Kim–Wright/ACM, via FRED) — revised over time, not a market quote.',
      yieldConfigTitle: 'The three configurations',
      yieldConfigReal: 'Real-driven rises are the classic gold headwind — gold pays no interest, so a higher real return on bonds weakens its case.',
      yieldConfigBreakeven: 'Breakeven-driven rises are neutral-to-positive for gold — the inflation-hedge channel.',
      yieldConfigPremium:
        'Term-premium-driven rises are the debasement configuration — historically supportive of gold: the answer to “yields are 5%, why is gold not collapsing?”.',
      yieldException:
        'The exception: inside funding stress, a term-premium spike can first hit gold through margin and liquidity spirals (the 2022 gilt episode’s analog) before the hedge bid dominates.',
      yieldSeats: 'Live seats:',
      /* GPE R13 / F3a (2026-11-18, s6/02 C2 + s7/01 §8): the Iran bridge —
       * the FA copy owns حباب (the EN renders the gloss "premium"); the
       * four-part grammar (formula stated · decomposition shown · as-of
       * stamped · divergence taught) binds every string here. No em dashes
       * in fa; the interpretation paragraph's four moves render in the
       * binding order. */
      bridgeTitle: 'The Iran bridge',
      /* GUX-S7 M2 (12 §3.3 row 5): the regional chapter chip — the
       * "clearly regional" rule, named at the chapter head. */
      bridgeRegionChip: 'Regional market · Tehran · Toman (IRR)',
      bridgeSubtitle: 'Tehran coin prices decomposed into global gold, the free-market dollar, and the local premium (حباب).',
      bridgeHeadPrice: 'Market price',
      bridgeHeadPremium: 'Premium (حباب)',
      bridgePremiumShort: '{v} premium',
      bridgeDiscountShort: '{v} discount',
      bridgeMillionToman: '{v}M toman',
      bridgeParityOunce: 'Global ounce {ounce} × free-market dollar {dollar} = {perOunce} toman per ounce',
      bridgeDecompLine: 'Pure content {pure} g of {total} g at {fineness} fineness → intrinsic {intrinsic} · market {market} → premium {premium} ({pct})',
      bridgeRowExpand: 'Show the parity',
      bridgeRowCollapse: 'Hide the parity',
      bridgeShowMethod: 'How it is computed',
      bridgeHideMethod: 'Hide the method',
      bridgeMethodTitle: 'The method',
      bridgeFormula: 'intrinsic = global ounce × free-market dollar × pure-gold content',
      bridgeConstantsTitle: 'Pure-gold content per instrument (CBI mint specs)',
      bridgeConstantsHeadInstrument: 'Instrument',
      bridgeConstantsHeadTotal: 'Total weight',
      bridgeConstantsHeadFineness: 'Fineness',
      bridgeConstantsHeadPure: 'Pure gold',
      bridgeGrams: '{v} g',
      bridgeGeramiBandNote: 'The gerami coin: 0.90–0.92 g pure (the exact minted figure is pending; both candidate readings sit inside the band, a ±0.5% intrinsic ambiguity).',
      bridgeMesghalNote: 'The mesghal follows the bazaar’s melted-gold (آبشده) convention: 4.6083 g × ≈0.705 fineness ≈ 3.249 g pure.',
      bridgeVariantNote: 'The CBI-primary full-coin spec is 8.136 g × 0.900; the widely-published 8.133 g variant is 0.04% apart.',
      bridgeShowInterpretation: 'What this board means',
      bridgeHideInterpretation: 'Hide the interpretation',
      bridgeInterp1: 'Every Tehran instrument is global gold × the free-market dollar × its pure-gold content, plus the local premium — the same three numbers this board shows, so you can reproduce every row: the parity line names the toman-per-ounce, the method block carries each instrument’s pure content. Did the coin move because of the ounce, the dollar, or the premium? Today’s answer needs two snapshots: until the premium has history, this card decomposes the level, not the day’s move.',
      bridgeInterp2: 'The premium (حباب) is a market-structure reading: coin scarcity, hoarding and local demand pressure in Tehran. An Emami premium near +2% is historically low; crisis regimes have printed 20–40% and higher — dated history, not a forecast.',
      bridgeInterp3: 'The same word, حباب, printed three different numbers within one hour on 2026-11-17: TGJU’s symbol 7.88M, this method 8.08M, a union press report 5.99M toman. Rival numbers publish undocumented; this card’s number is reproducible from the stated formula — that is the whole claim.',
      bridgeInterp4Pre: 'The free-market dollar is the second leg of every Iranian gold price: when the ',
      bridgeInterp4Post: ' lane moves, the parity line moves with it — and the global ounce at the top of this page is the first.',
      bridgeSourceNote: 'Source: TGJU',
      bridgeRevisionNote: 'Quotes are TGJU’s own published values and may be revised.',
      bridgeStaleNote: 'stale — showing the last good snapshot',
      bridgeNoParity: 'The premium needs both the global ounce and the free-market dollar; one leg is missing right now — the prices above are still TGJU’s own quotes.',
      bridgeUnavailable: 'The Tehran board could not be read yet.',
      bridgeSnapshotNote: 'Tehran snapshot {time} UTC',
      /* GPE R14 / F2a Tier-1 (2026-11-18, s7/01 §6 + s6/02 C6/C7 rule 3):
       * the central-bank demand tracker — display-only, the reported-world
       * honesty in every line. */
      cbTitle: 'Central-bank demand',
      cbSubtitle: 'Who is buying gold — the structural story of the decade.',
      cbChartTitle: 'Global net purchases, rolling 12 months',
      cbChartReportedWorld: 'the reported world',
      cbChartUnit: 'tonnes per year',
      cbEpGfc: '2009–2011: the post-GFC wave — selling turns to buying',
      cbEpCatchup: '2015: China’s six-year catch-up print lands as one month',
      cbEpRotation: '2022: the buyer rotated',
      cbCurrentPace: 'now',
      cbAsOf: 'data through {month}',
      cbBuyersTitle: 'Top buyers, trailing 12 months',
      cbBuyersHeadCountry: 'Country',
      cbBuyersHeadLatest: 'Latest month',
      cbBuyersHead12m: '12-month net',
      cbBuyersHeadHoldings: 'Holdings',
      cbBuyersHeadShare: 'Gold share of reserves',
      cbTonnesShort: '{v} t',
      cbSharePct: '{v}%',
      cbShareNote: 'Gold valued at the live market price over total official reserve assets (gold re-valued at the same price; each country’s latest reported value vintage). A rising share can be price arithmetic, not active buying.',
      cbReportedWorldLine: 'Reported world: {tonnes} t across {n} reporters — not the whole world.',
      cbMethodTitle: 'Method',
      cbMethodLine: 'Source: IMF (monthly reserves) — the IL and IRFCL dataflows, merged per country (the fresher observation wins). Aggregates, the BIS banking book and broken rows are excluded.',
      cbRevisionNote: 'Monthly data is revised; some buyers report with a lag.',
      cbChinaNote: 'China reports irregularly and with long lags — a quiet month is not always a pause in buying.',
      cbWgcLink: 'The World Gold Council’s curated tables',
      cbGovernanceNote: 'This section is display-only: it teaches the demand story and does not vote in the meter above.',
      cbCaveat: 'Central-bank demand is slow, lumpy, lagged and revised — it explains quarters, not weeks.',
      cbMirrorPre: 'The mirror view: a rising USD share of FX reserves is a gold headwind — see ',
      cbMirrorPost: '.',
      cbUnavailable: 'The central-bank tracker could not be read yet.',
      /* GPE R16 / F16b (2026-11-18): the market-state pill — the reference
       * market + timezone named at point of use (the GPE-S3-10 lesson);
       * derived from the live-prices feed + the static COMEX schedule. */
      marketPillOpen: 'Market open',
      marketPillClosed: 'Market closed',
      marketPillLabel: '{state} · COMEX gold futures, New York ({tz})',
      /* GPE R18 / F7 (2026-11-18): the interactive price chart — the
       * copy rides the same vocabulary as the TA band (C5's TGJU words:
       * «میانگین متحرک») and reuses the ui corpus's range/words wherever
       * one exists (chartRangeLabel · rangeQuarter · range1y ·
       * rangeWindowYears — C7 rule 1, no parallel copy). The honest-span
       * discipline (the #01 fix's grammar): the All chip and the window
       * delta name the span the loaded series ACTUALLY carries, computed
       * from the data. */
      chartSeriesLine: 'XAUUSD daily OHLC (spot) · EODHD',
      chartUnitLabel: 'Price unit',
      chartUnitOz: 'Ounce',
      chartUnitGram: 'Gram',
      chartUnitOzShort: 'per oz',
      chartUnitGramShort: 'per g',
      chartGramNote: '1 troy oz = 31.1035 g',
      chartLog: 'Log',
      chartSma50: '50-day average',
      chartSma200: '200-day average',
      chartRangeAll: 'All',
      chartSpanMonths: '{n} months',
      chartSpanYears: '{years} years',
      chartAria: 'XAUUSD daily closes, interactive chart: {span} ending {date}',
      chartPanHint: 'Drag to pan · pinch or scroll to zoom',
      /* GPE R19 / F8 (2026-11-18): the minimal TA band — the C5 honesty
       * rules ride the copy itself (descriptive reference; dated events
       * with whipsaws; the decile grammar over the stored basis — S13-D1
       * names the window, never a "decade" the data cannot support; the
       * TGJU vocabulary «سطوح پیوت» / «حمایت» / «مقاومت»; the
       * classic-only guard is structural — nothing else computes). */
      taTitle: 'Reference levels',
      taSubtitle: 'Descriptive reference, not a guarantee — and never a trading signal.',
      taSeriesNote: 'SMA 20/50/100/200 of XAUUSD daily closes, EODHD',
      taSmaTitle: 'The four standard moving averages',
      taSmaOneLiner: 'The average close of the last N days — the trend’s reference line, named for its window; a descriptive reference, not a guarantee.',
      taSmaRow: '{n}-day average',
      taSmaNone: 'The stored window is still shorter than the 20-bar average — no level yet.',
      taDistance: '{pct} {dir} the 200-day average of XAUUSD daily closes — {decile} percentile of the stored {window}',
      taDistanceNoDecile: '{pct} {dir} the 200-day average of XAUUSD daily closes — the stored window is still too short for a percentile (it grows with every day)',
      taDirAbove: 'above',
      taDirBelow: 'below',
      taDecile: '{n}th percentile',
      taChartLink: 'See the chart',
      taCrossTitle: 'The 50/200 crossovers — dated events',
      taCrossOneLiner: 'The day the 50-day crossed the 200-day — a dated event with what followed, whipsaws included.',
      taCrossGolden: 'Golden cross (50 above 200)',
      taCrossDeath: 'Death cross (50 below 200)',
      taCrossFollow: 'then {v} over the next 20 sessions',
      taCrossTruncated: 'at the window’s edge',
      taCrossNone: 'No 50/200 crossover in the stored window yet.',
      taPivotsDailyTitle: 'Classic daily pivots',
      taPivotsWeeklyTitle: 'Classic weekly pivots',
      taPivotOneLinerDaily: 'Yesterday’s high, low and close turned into today’s reference levels — levels the market watched, not promises.',
      taPivotOneLinerWeekly: 'The same arithmetic on last week’s session — the swing trader’s reference grid.',
      taPivotSupport: 'Support',
      taPivotResistance: 'Resistance',
      taPivotFrom: 'from the session of {date}',
      taPivotNone: 'Not enough stored bars for this table yet.',
      taShow: 'Show the tables',
      taHide: 'Hide the tables',
      taUnavailable: 'The reference levels could not be read yet.',
      /* GPE R20 / F4a (2026-11-18): the education on-ramp — the five
       * drivers (Kitco’s five, the S7-D2 taxonomy), each a three-move
       * paragraph closing LIVE at its lane (the {count} and {laneWord}
       * render from the projection — never hand-copied into the
       * dictionary; a consistency test pins them to the hero’s own
       * numbers); the two closing notes (fuel-not-driver; the governance
       * asymmetry taught); the six-question FAQ as the on-ramp’s tail
       * (the S7 format decision). The s7/02 approved drafts are the
       * reference wording (D1 locked: the structure and honest-limits
       * content bind; the rounds polish). */
      onRampTitle: 'What moves gold',
      onRampSubtitle: 'Five drivers, honestly — each measured on this page by its own gauge.',
      onRampShow: 'Read: what moves gold',
      onRampHide: 'Hide: what moves gold',
      onRampSeeCards: 'The measuring cards:',
      driverName1: 'Real interest rates and the Fed',
      driverBody1:
        'Gold pays no yield, so its strongest headwind is a high real (inflation-adjusted) interest rate and its strongest tailwind is a falling one. But the market trades the expectation, not the level: a rate rise that is fully priced in is a non-event, and a dovish surprise inside a hiking cycle can lift gold. Since 2022 the old rule has visibly weakened — real yields rose sharply while gold rose too, because the marginal buyer changed (see Central banks below). Measured today by the borrowing-costs family — {count} of the 37 factors, currently {laneWord}.',
      driverName2: 'Inflation and currency debasement',
      driverBody2:
        'Gold’s reputation as an inflation hedge is earned over decades, not weeks: over long horizons it tracks purchasing power; over a few quarters what matters most is how the Fed responds to inflation, which is why real rates (above) are the better day-to-day guide. The cleanest single summary is the gap between today’s inflation and the inflation the market expects (breakevens): when the gap closes through hawkish policy, that pressures gold; when it closes through lost credibility, that supports it. Watch the gap over months, not one month — single months are noise. Measured today by the inflation family — {count} of the 37 factors, currently {laneWord}.',
      driverName3: 'The U.S. dollar',
      driverBody3:
        'Gold is priced in dollars, so a stronger dollar tends to weigh on the gold price and a weaker one tends to lift it — even when nothing about gold itself has changed. The rule has two famous breaks: in market stress the dollar and gold are bid together (the same flight-to-safety trade), and in de-dollarization episodes both rise (reserve diversification). Gold can also sit at all-time highs in euros or yen while consolidating in dollars — check the price in another currency before calling a gold move global. Measured today by the dollar family — {count} of the 37 factors, currently {laneWord}.',
      driverName4: 'Central banks',
      driverBody4:
        'Central banks are among the largest holders of gold, and after the 2022 freezing of Russia’s reserves their buying roughly doubled — a comparatively price-insensitive demand that raised gold’s floor and weakened the old real-rates rule. The honest limits: this buying is slow, lumpy and reported with delay and revisions; it explains a floor rising over quarters, not support in every drawdown — and a rising gold share of reserves can be price arithmetic, not new buying. This is the one driver our 37-factor meter deliberately does not vote on (yet): meter membership is a governed, backtested decision, so the demand story lives in its own data section.',
      driverName5: 'Safe-haven and investment demand',
      driverBody5:
        'In periods of market stress, geopolitical risk or currency uncertainty, investors move into gold — and flows into and out of gold-backed ETFs make that demand visible daily. Two channels hide inside “safe haven”: the headline premium (a war or shock bid that often fades within days or weeks when the consequences don’t materialize) and the structural shift (sanctions and reserve freezes change official-sector behavior for years). Don’t conflate them. Measured today by the stress family — {count} of the 37 factors, currently {laneWord}.',
      noteFuelTitle: 'Positioning is fuel, not a driver',
      noteFuelBody:
        'One thing this page deliberately does not teach as a driver: crowded positioning. Futures speculators’ books are the market’s fuel gauge — at extremes they mark fragile, crowded trades (in either direction); in the middle of the range they carry little information. The flows family measures it with a deliberately short horizon (days to weeks).',
      noteGovTitle: 'Why five drivers here and five lanes in the meter — and not the same five',
      noteGovBody:
        'Because the meter only votes on relations that measured stable enough to backtest: growth was excluded (its members’ gold relation was unstable), trend lives in the reference-levels band (not a vote), and central-bank demand is presented, not voted (its own section below). Every exclusion is a recorded decision, not a gap — the honest record at the bottom of the page lists them.',
      faqTitle: 'Common questions',
      faqQ1: 'Is gold a good inflation hedge?',
      faqA1:
        'Over decades, yes — gold tracks purchasing power in the long run. Over a few quarters it depends on how the Fed responds to inflation, which is why real rates (driver 1) are the better day-to-day guide. The cleanest summary is the gap between today’s inflation and the inflation the market expects (breakevens).',
      faqQ2: 'Yields went up and gold went up too — why?',
      faqA2:
        'Look at which piece of the yield moved: real-yield-driven rises are the classic headwind, but term-premium-driven rises have historically supported gold instead (the decomposition card above names the three configurations). And look at who was buying — the post-2022 central-bank bid lifted gold even as real yields rose (the demand section below).',
      faqQ3: 'Gold is at a record in euros but not in dollars — which is real?',
      faqA3:
        'Both are real: gold is priced in dollars, so a stronger dollar can mask a global rise — driver 3’s rule and its two famous breaks. Check the price in another currency before calling a move “global” — the five-currency grid below the ratios reads the same ounce through five numeraires.',
      faqQ4: 'Does the 37-factor meter predict the price?',
      faqA4:
        'No. It describes conditions, and the page’s own published backtest measured that the lean showed no positive association with the next 5 to 60 trading days — if anything, readings against gold came before larger rises. The honest record at the bottom of the page carries the full measured result.',
      faqQ5: 'What is the coin’s حباب, and why does every site show a different number?',
      faqA5:
        'The حباب (premium) is the coin’s market price over its melt value — global gold × the free-market dollar × pure-gold content. Rival numbers publish undocumented (three different numbers within one hour, documented on this page); this page’s number is reproducible from the stated formula — that is the whole claim. See the Iran bridge below.',
      faqQ6: 'Why do some factors say “couldn’t be read”?',
      faqA6:
        'A dark seat is dark for one of four knowable reasons: the source stopped publishing, the year-ago base month was not published (a publication gap), the data is published but the pipeline has not landed it yet, or the reading is fresh but the evaluator had no input to evaluate. Each dark seat states which one it is — the page never shows a guess.',
      /* GPE R21 / F4b (2026-11-18): the one-liners set — one plain meaning
       * sentence under every context card’s value (the s7/02 §2 drafts,
       * complete against the 13 non-hero card ids), plus the Chain-7
       * physical grouping: the «بازار فیزیکی» mini-header + ONE shared
       * sensor-not-verdict reading line under the three physical cards. */
      meaningGoldSilver: 'How many ounces of silver one ounce of gold buys — when the ratio is high, silver is cheap relative to gold.',
      meaningGoldBtc: 'The ounce-to-bitcoin exchange rate — the two debasement hedges priced against each other.',
      meaningGoldAud: 'Gold priced in Australian dollars — how the metal reads for a commodity-currency holder.',
      meaningGoldOilRatio: 'How many barrels of oil one ounce of gold buys — gold’s energy purchasing power.',
      meaningGoldPlatinum: 'Gold against its industrial precious sibling — the monetary metal’s rarity premium made visible.',
      meaningRealGoldPrice: 'Today’s gold price in inflation-adjusted dollars — the long-horizon value gauge (what an ounce has been worth across decades).',
      meaningCopperGold: 'Gold against copper — the monetary metal versus the industrial cycle in one number.',
      meaningGoldEquitiesRatio: 'Gold against the S&P 500 — the defensive-versus-risk balance over the long cycle.',
      meaningCftcPositioning: 'What gold futures speculators hold net long — the crowd gauge. Extremes mark fragile trades; the middle of the range tells you little.',
      meaningCftcGrossLong: 'The gross long share of open interest — how one-sided the speculative book is.',
      meaningSgeWithdrawals: 'How much gold left Shanghai vaults for delivery — China’s physical demand pulse.',
      meaningSwissFlow: 'Switzerland’s gold imports and exports — where the world’s refining hub is sending the metal.',
      meaningShanghaiPremium: 'The Shanghai-over-London price gap — the market’s own sensor for where the physical buyer is.',
      physicalHeader: 'The physical market',
      physicalLine: 'Persistent premiums mark phases when physical (mainly Asian) demand is the marginal bid; discounts mark Western-investment-led phases.',
      /* GPE R22 / F11 (2026-11-19): the correlation companion — the
       * mandated Zone K design (s7/01 §3 in full): the dual-axis chart +
       * the 52-week rolling strip + the dated 2022 annotation + the
       * methodology footer with the pre-registered windows printed
       * verbatim (S7-D7, the anti-GPE-S3-05 clause). The scatter stays
       * rejected; fail-closed when either series is stale. */
      corrTitle: 'Gold and real yields — the relationship that changed',
      corrSubtitle: 'The old inverse rule, its 2022 break, and the rolling correlation that shows both — no single number hides the convention.',
      corrGoldLabel: 'Gold — XAUUSD daily closes (left)',
      corrYieldLabel: '10-year real yield % (right)',
      corrStripTitle: '52-week rolling correlation (levels)',
      corrStripNone: 'The stored window carries {n} weekly Friday closes so far — the first 52-week correlation point needs 52. It computes itself as the series grows.',
      corrRotationLabel: '2022: the buyer rotated',
      corrRotationLine: 'February 2022 — the reserve freeze dated the rotation; the demand tracker above tells who stepped in.',
      corrMethodSeries: 'Gold = XAUUSD daily closes (EODHD) · real yield = 10-year TIPS yield (Treasury / FRED DFII10)',
      corrMethodWindow: 'weekly Friday closes · 52-week rolling Pearson · levels · display window: {window}',
      corrCaveat: 'Correlation is one factor, not a forecast formula — and a different sampling day moves the number. That is exactly why the windows are pre-registered and printed on this panel.',
      corrStale: 'One of the two series is stale — gold {goldAge} days old, the real yield {yieldAge} days old. The panel waits rather than guessing.',
      corrNotEnough: 'The two series share too few common days so far — the panel waits for the data.',
      corrUnavailable: 'The correlation panel could not be read yet.',
      /* GPE R24 / F22 (2026-11-19): the London vault + clearing cards —
       * Zone K riders, collapsed headers with the top-line at 390;
       * "Source: LBMA" + the four-field disclosure block (C6). */
      lbmaVaultTitle: 'London vault stock',
      lbmaVaultTopline: 'London vaults hold {tonnes} t of gold',
      lbmaVaultSilver: 'plus {tonnes} t of silver',
      lbmaVaultMom: '{pct} vs the previous month',
      lbmaClearingTitle: 'London clearing volumes',
      lbmaClearingTopline: '{moz} M oz of gold cleared in {month}',
      lbmaClearingRow: '{moz} M oz · ${bn} bn · {transfers} transfers',
      lbmaClearingContext: 'On average, more than 20 million ounces of gold is cleared daily in the London market — the net transfers settled between the four LBMA market-maker banks that own London Precious Metals Clearing (LPMCL).',
      lbmaMethodTitle: 'Method',
      lbmaMethodVault: 'Source: LBMA (London vault holdings) — monthly, one month in arrears. Holdings on the last day of the month, all physical forms within the M25 including the Bank of England’s gold (the Bank holds no silver); the full 124-month series from July 2016.',
      lbmaMethodClearing: 'Source: LBMA (clearing statistics) — the net volume of gold and silver transferred between LPMCL’s member banks, monthly; the full 360-month series from October 1996.',
      lbmaAsOf: 'data through {month}',
      lbmaShow: 'Show the details',
      lbmaHide: 'Hide the details',
      lbmaUnavailable: 'The London vault data could not be read yet.',
      /* GPE R26 / F10 (2026-11-19): the multi-currency gold grid — Zone I
       * compact sub-card; EUR/AUD native + JPY/GBP/CNY derived (the
       * S14-D1 record, every leg named per C1); each cross's own decile
       * over its STORED basis (the S13-D1 honest window, named per row)
       * + the KGX validation sentence. */
      gridTitle: 'Gold in five currencies',
      gridSubtitle: 'The same ounce through five numeraires — the dollar story made visible.',
      gridFormula: 'EUR and AUD are the provider’s own XAU crosses; JPY, GBP and CNY derive exactly as XAUUSD × USDJPY, XAUUSD ÷ GBPUSD and XAUUSD × USDCNY (EODHD daily closes).',
      gridBasisNote: 'The position is each cross’s own stored window ({window} today) — it widens as the stored series does.',
      gridPositionLine: '{band} of its stored window',
      gridBandTop: 'top {p}%',
      gridBandBottom: 'bottom {p}%',
      gridBandMid: 'mid-range',
      gridChange30d: '30 days',
      gridKgxTitle: 'The validation sentence',
      gridKgxGenuine: 'Gold rose in USD and in {ups} of {known} crosses over the last 30 days — genuine demand, not just a dollar move.',
      gridKgxDollar: 'Gold rose in USD but fell in {downs} of {known} crosses over the last 30 days — the dollar story, not a global bid.',
      gridKgxWeak: 'Gold fell in USD but rose in {ups} of {known} crosses over the last 30 days — the dollar weakening, not a global retreat.',
      gridKgxMixed: 'Gold’s 30-day moves split across currencies ({ups} of {known} up) — no single story; read the rows.',
      gridKgxNone: 'The 30-day windows need more stored data.',
      gridUnavailable: 'The currency grid could not be read yet.',
      /* GPE R28 / F24 + R29 / F25 (2026-11-19): the expectations strip —
       * Zone D's fourth element. THE KALSHI LEG DOES NOT SHIP (S15-D1:
       * the Developer Agreement wording read dropped it); the card
       * renders the Polymarket leg alone, honestly named as ONE venue,
       * display-only + attributed + linked + the honest
       * trader-expectations disclaimer. The calendar strip rides the
       * SAME insights snapshot (zero new fetches); the zone named at
       * point of use (GPE-S3-10) — the feed carries dates + zones,
       * never clock times; none invented. */
      expectTitle: 'What the market expects',
      expectSubtitle: 'The next Fed meeting through the traders’ own prices — one venue, display-only.',
      expectShow: 'Show the market’s expectation',
      expectHide: 'Hide the market’s expectation',
      expectTopLine: 'Next: Fed {date} · {move} odds {pct}',
      expectTopLineNoMarket: 'Next: Fed {date}',
      expectMoveHike50plus: '+50 bp or more',
      expectMoveHike25: '+25 bp',
      expectMoveHold: 'no change',
      expectMoveCut25: '−25 bp',
      expectMoveCut50plus: '−50 bp or more',
      expectEventLine: 'Market: {title} — resolves by {date}',
      expectVenue: 'Source: Polymarket — market-implied probabilities, refreshed every 30 minutes.',
      expectLink: 'View the market ↗',
      expectDisclaimer: 'This is the traders’ expectation, not our forecast.',
      expectAsOf: 'as of {date} · {time} UTC',
      expectRollNote: 'When a meeting ends, the market rolls to the next one.',
      expectMismatchNote: 'The calendar’s next Fed meeting and the market’s listed event differ — both shown separately.',
      expectUnavailable: 'The market’s expectation could not be read yet.',
      calNextTitle: 'Next up on the calendar',
      calZoneNY: 'New York time',
      calZoneFrankfurt: 'Frankfurt time',
      calZoneSydney: 'Sydney time',
      calDaysAway: 'in {n} days',
      calToday: 'today',
      calTomorrow: 'tomorrow',
      /* GPE R25 / F6 (2026-11-19): the Episode Explorer — Zone O's
       * history tail. The nine records' editorial content (the s7/03
       * §3.2 launch list, CP-C-locked): titles, annotations,
       * interpretations and the family readings (the hasData honesty
       * flag — a family without series coverage renders the shared
       * no-series line, never a guess). THE METER-ERA BOUNDARY (s7/03
       * §3.4): no record renders a historical "verdict" — the meter
       * exists only 2016+. The price path + the comparison rider ride
       * the WGC prices-workbook drop (S15-D4) and render the honest
       * waiting state until it lands. */
      epTitle: 'Gold in history',
      epSubtitle: 'Nine episodes from the end of Bretton Woods to today — the honest record: what the chains did, never a historical verdict.',
      epShow: 'Explore the episodes',
      epHide: 'Hide the episodes',
      epMeterEraNote: 'The 37-factor meter has existed only since 2016 — no episode here shows a historical “verdict”. Before 2016 the chains are taught; after 2016 the record says what conditions actually were, never what they “should” have been.',
      epPeriodNow: 'now',
      epLivingBadge: 'living',
      epLivingNote: 'This is the one living record: its correction leg updates by dated edits, never silent rewrites.',
      epFamilyNoData: 'No series for this family in this period.',
      epFamBorrowing: 'Borrowing costs',
      epFamDollar: 'The dollar',
      epFamStress: 'Stress',
      epFamInflation: 'Inflation',
      epFamFlows: 'Flows',
      epFamDemand: 'Central-bank demand',
      epSourcesTitle: 'Sources',
      epLicenceL1: 'public-domain source',
      epLicenceL2: 'attribution-required source',
      epLinksTitle: 'See on this site',
      epPathTitle: 'The price path',
      epPathWaiting: 'The price path lights up when the WGC prices workbook (monthly averages since 1978) arrives as the owner’s data drop — until then nothing is drawn here. Pre-1978 episodes carry their documented public-history values inside their records.',
      epPathExtremes: 'start {from} → end {to} · period low {min} · period high {max} (US$/oz, monthly averages)',
      epPathSource: 'Source: World Gold Council — monthly averages in US dollars, through {month}',
      epComparisonTitle: 'The comparison rider',
      epComparisonWaiting: 'The gold vs S&P vs silver vs Bitcoin comparison computes from the same workbook spine — it arrives with the drop, every window named at point of use.',
      epWindow1y: '1 year',
      epWindow5y: '5 years',
      epWindow10y: '10 years',
      epWindow20y: '20 years',
      epWindowNoData: 'not enough stored history',
      epSinceTitle: 'Since this episode',
      epPastReturnsNote: 'Past returns are no guarantee of future results.',
      /* ---- The nine records (1971 → 2024–26; the typed structure lives
       * in gold-episodes-records.ts — every string here). ---- */
      ep1971Title: 'Bretton Woods ends',
      ep1971Annotation: 'The dollar left gold at $35; two devaluations followed.',
      ep1971Interpretation: 'For a quarter-century the world’s currencies were fixed to the dollar, and the dollar to gold, at $35 an ounce. In August 1971 the United States suspended convertibility; the official price stepped to $38 (December 1971) and then $42.22 (February 1973) before the major currencies floated. Released from the peg, gold more than doubled within three years — the metal’s first modern demonstration that it prices the state of official money. The families’ series barely reach this far back: read it as history, through the dollar and inflation families only.',
      ep1971FamDollar: 'The parity steps ARE the episode — the official price of the dollar in gold was cut twice in 26 months.',
      ep1971FamInflation: 'U.S. inflation accelerated through the devaluations, from about 3% in 1971 toward double digits by 1974.',
      ep1980Title: 'The Volcker peak',
      ep1980Annotation: 'Gold touched about $850 in January 1980; disinflation then drove a two-decade bear.',
      ep1980Interpretation: 'The second oil shock, the hostage crisis and the Soviet invasion of Afghanistan pushed U.S. inflation past 10%, and gold ran from about $240 (1979) to about $850 on 21 January 1980 — a mania that ended the month it peaked. Paul Volcker’s October 1979 change of operating procedure (targeting bank reserves, letting rates find their level) broke inflation psychology over the following years, and gold fell through 1981 and long after. Real yields did not yet exist as a series (TIPS begin 1997): the honest reading here is inflation and the dollar.',
      ep1980FamDollar: 'The index firmed as U.S. rates were allowed to rise without a ceiling — the dollar’s own crisis years ended in a peak.',
      ep1980FamInflation: 'Headline CPI ran to about 13–14% in 1980 — the peak of the great inflation; the Volcker regime is what ended it.',
      ep1999Title: 'Brown’s bottom',
      ep1999Annotation: 'The U.K. announced sales of half its gold; the price bottomed near $252.',
      ep1999Interpretation: 'In May 1999 the U.K. Treasury announced it would sell more than half of Britain’s gold reserves through auctions; the price bottomed near $252 an ounce in July 1999, the multi-decade low. In September 1999 fifteen European central banks signed the Washington Agreement capping official sales, and the price spiked about 25% in days. The episode is the demand family’s founding lesson — official-sector behaviour moves the floor — written before any demand series existed (the WGC quarterly series begins 2002).',
      ep1999FamDollar: 'Firm through the late-1990s productivity boom — a strong-dollar policy era; a headwind for the whole episode.',
      ep1999FamInflation: 'Quiet, near 2% — this episode is a demand story, not an inflation story.',
      ep1999FamFlows: 'Speculative length was low at a 20-year price low — the crowd was absent at the bottom.',
      ep2008Title: 'The financial crisis',
      ep2008Annotation: 'Lehman’s fall took gold down in the dash-for-cash; the response then lifted it.',
      ep2008Interpretation: 'Gold entered 2008 near $850 and peaked above $1,000 in March; after Lehman fell in September, the dash-for-cash took gold down about 20% to near $700 — collateral, not a haven, in the panic’s first weeks. Then the policy response (rates to zero, QE) lifted it back above $900 by year-end and to new highs through 2009–2011. The two-phase behaviour — sell first, rally on the response — is the stress family’s own lesson, visible in this episode from the start.',
      ep2008FamBorrowing: 'Real yields collapsed with policy rates — the classic tailwind arriving after the panic.',
      ep2008FamDollar: 'The index spiked in the dash-for-cash (the world buying dollars), then eased as the Fed cut to zero.',
      ep2008FamStress: 'The all-time VIX regime of late 2008 — the stress family’s defining record.',
      ep2008FamInflation: 'Headline went negative on the oil crash — a deflation scare, not inflation.',
      ep2008FamFlows: 'Speculative length washed out in the panic, then rebuilt with the recovery.',
      ep2011Title: 'The QE-era peak',
      ep2011Annotation: 'Gold peaked near $1,920 as QE2 and the euro debt crisis peaked together.',
      ep2011Interpretation: 'Gold’s September 2011 peak (about $1,920 spot) came with real yields negative, a U.S. debt-ceiling standoff and the euro debt crisis at its worst — the QE2-era speculative peak. It was followed by a four-year bear market: the 2013 taper took the same drivers and ran them in reverse. The honest reading: conditions were extreme, and extreme conditions are not a forecast of more extreme — the page’s own backtest lesson, visible in history first.',
      ep2011FamBorrowing: 'The 10-year real yield near −1% — the deepest negative of the series to that date.',
      ep2011FamDollar: 'The index near its cycle lows — the euro-crisis paradox of a weak dollar despite Europe’s crisis.',
      ep2011FamStress: 'Elevated but not extreme — a slow-burn crisis, not a panic.',
      ep2011FamInflation: 'Headline near 3.5% and falling; the inflation story was expectations, not prints.',
      ep2011FamFlows: 'Record speculative length — the crowd was all-in at the top: the fuel-not-driver lesson’s own exhibit.',
      ep2013Title: 'The taper tantrum',
      ep2013Annotation: 'The mere announcement of slower QE took gold down about 28% in 2013.',
      ep2013Interpretation: 'Gold’s April 2013 two-day collapse (about $1,550 to $1,350) had already priced the coming turn before Bernanke’s May testimony hinted the Fed would slow its purchases; the year ended near $1,200 — a 28% annual fall, the worst in three decades. The driver was expectations, not levels: yields rose on the announcement while the inflation backdrop was unchanged — the education page’s first driver (the market trades the expectation, not the level), written in 2013’s chart first.',
      ep2013FamBorrowing: 'Real yields rose from negative toward +1% — the mechanical headwind, priced before it arrived.',
      ep2013FamDollar: 'Firming through the year — the taper’s other leg.',
      ep2013FamStress: 'Low — the tantrum was a rates event, not a stress event.',
      ep2013FamInflation: 'Near 1.5% and falling — no inflation story at all.',
      ep2013FamFlows: 'The long unwinding — speculative length fell through the whole year.',
      ep2020Title: 'COVID',
      ep2020Annotation: 'The March dash-for-cash took gold down; the response took it to a then-record.',
      ep2020Interpretation: 'In March 2020 gold fell about 12% in the dash-for-cash — again collateral, not a haven, in a panic’s first weeks — then the pandemic response (zero rates, QE at scale, fiscal transfers) carried it to a then-record near $2,075 in August 2020. The episode repeats 2008’s shape at greater speed, and adds the demand family’s modern chapter: official buying continued through the panic year.',
      ep2020FamBorrowing: 'The deepest negative prints of the series’ history (near −1.1% on the 10-year) — the policy floor.',
      ep2020FamDollar: 'The March spike, then a year-long slide — the response’s other leg.',
      ep2020FamStress: 'The pandemic VIX regime — second only to 2008 in the series.',
      ep2020FamInflation: 'Near zero in May 2020, then the start of the greatest acceleration since the 1970s.',
      ep2020FamFlows: 'The March washout, then the fastest rebuild — the two-phase record again.',
      ep2020FamDemand: 'Official buying held through the panic year — the floor’s other name.',
      ep2022Title: 'The sanctions rotation',
      ep2022Annotation: 'The freezing of Russia’s reserves doubled central-bank buying; gold rose anyway.',
      ep2022Interpretation: 'After Russia’s reserves were frozen in February 2022, official-sector gold buying roughly doubled — a comparatively price-insensitive bid that raised gold’s floor and broke the old real-rates rule. Gold peaked near $2,070 in March 2022, then fell to about $1,615 by September as real yields surged above +1.5% — and held far above its historical real-yield break-evens: the relationship itself had rotated. This record is the Zone K companion chart’s own annotation target; the meter-era boundary below says what conditions actually were, never what they should have been.',
      ep2022FamBorrowing: 'The fastest rise of the series (about −1% to above +1.5%) — and gold rose anyway: the rule’s break.',
      ep2022FamDollar: 'The strongest dollar of the decade beside the strongest gold of the era — the de-dollarization exception visible in one year.',
      ep2022FamStress: 'The invasion regime (VIX above 30), then the hiking-stress year.',
      ep2022FamInflation: 'The 9% prints of mid-2022 — the inflation family’s own record of the decade.',
      ep2022FamFlows: 'Speculative length fell as the price fell — the price-insensitive buyer was official, not speculative.',
      ep2022FamDemand: 'The doubling — the record year of the series (above 1,000 tonnes for the first time).',
      ep2024Title: 'The melt-up and correction',
      ep2024Annotation: 'Gold rose above $5,500 in 2026, then corrected below $3,800 by Nov 2026.',
      ep2024Interpretation: 'From about $2,050 in February 2024 gold more than doubled to its 2026 peak above $5,500 — the sanctions-era buying continuing, the de-dollarization bid broadening, and the speculative crowd returning only late. The correction leg is live as of November 2026: the price sits at the bottom of its one-year stored window (about $3,793 on 18 November 2026). This is the one LIVING record: its correction leg updates by dated edits, never silent rewrites — and the meter-era boundary says what conditions are, not what they should be.',
      ep2024FamBorrowing: 'Positive and rising through the melt-up — the old rule stayed broken for years.',
      ep2024FamDollar: 'Mixed — the move was multi-currency (see the currency grid’s KGX sentence).',
      ep2024FamStress: 'Episodic, not the driver — the melt-up was a demand story.',
      ep2024FamInflation: 'The deceleration from 2022’s peak — inflation cooled while gold ran: the debasement-hedge bid is slower than prints.',
      ep2024FamFlows: 'The crowd returned late — the fuel arriving after the fire: the fuel-not-driver lesson’s live exhibit.',
      ep2024FamDemand: 'The continuation — the third consecutive four-digit tonnage year.',
      /* ---- The records’ sources (named for what they are). ---- */
      epSrcParity: 'The U.S. official gold-parity chronology (the $35, $38 and $42.22 steps)',
      epSrcFed1979: 'Federal Reserve historical records (the October 1979 operating change)',
      epSrcPress1980: 'The documented 21 January 1980 spot peak (about $850)',
      epSrcBoeAuctions: 'Bank of England gold auction announcements (1999–2002)',
      epSrcWag: 'The Washington Agreement on Gold (September 1999)',
      epSrcFed2008: 'Federal Reserve policy records (the 2008 rate path to zero)',
      epSrcPress2008: 'The documented 2008 spot path (March above $1,000; autumn near $700–750)',
      epSrcPress2011: 'The documented September 2011 spot peak (about $1,920)',
      epSrcTips: 'The TIPS real-yield record (the 2011 trough near −1%)',
      epSrcFedTaper: 'The Federal Reserve’s 2013 policy communications record',
      epSrcPress2013: 'The documented 2013 spot path (April’s two-day collapse; the year near $1,200)',
      epSrcWgcHistory: 'World Gold Council — Gold Demand Trends (the historical series)',
      epSrcPress2020: 'The documented 2020 spot path (March’s fall; August near $2,075)',
      epSrcPress2022: 'The documented 2022 spot path (March near $2,070; September near $1,615)',
      epSrcPress2024: 'The documented 2024–26 spot path (February 2024 about $2,050; the 2026 peak above $5,500; November 2026 about $3,793)',
      /* GPE R27 / F14 (2026-11-19): the COT percentile band chips + the
       * crowd-gauge flag on the Zone J cards — position + band, never
       * direction; the days–weeks horizon label always renders; the
       * D5-locked convention named at point of use. */
      cotBandChip: 'vs its decade: {band}',
      cotChipTop: 'top {p}%',
      cotChipBottom: 'bottom {p}%',
      cotChipMid: 'mid-range',
      cotCrowdHigh: 'Statistically high vs the past decade — a crowded book. Extremes mark vulnerability in either direction (days–weeks horizon).',
      cotCrowdLow: 'Statistically low vs the past decade — a crowded book on the other side. Extremes mark vulnerability in either direction (days–weeks horizon).',
      cotCrowdMid: 'Mid-range vs the past decade — the fuel gauge carries little information here; it matters at the extremes (days–weeks horizon).',
      cotConventionNet: 'non-commercial net longs as a share of open interest — the CFTC weekly CoT report',
      cotConventionGross: 'gross longs as a share of open interest — the CFTC weekly CoT report',
      /* GPE R30 / F3b (2026-11-19): the premium history — the Zone F
       * extension (s1/11 §8 phase 2: the same zone, later wave). The
       * day-move strip: EXACT identity arithmetic (Δln(coin) = Δln(ounce)
       * + Δln(USD/IRR) + Δln(1+premium)) — never GRAM-style regression;
       * the s7/01 §8 binding copy printed at point of use. The deciles
       * ride the R19 posture (min base 30, the current point excluded,
       * the window named). The honesty line: "reconstructed from source
       * history" vs "computed live from our snapshots". */
      prTitle: 'The premium’s history (حباب)',
      prSubtitle: 'The coin premium is no longer just a live number — its series, its statistical place, and its day-move decomposition live here.',
      prStripLine: 'Today vs {date}: the Emami coin {coin} — ounce {ounce}, dollar {dollar}, premium {premium}.',
      prStripMethod: 'An exact identity: Δln(coin) = Δln(ounce) + Δln(USD/IRR) + Δln(1+premium) — the three factors MULTIPLY into the coin’s move, they do not add. This is identity arithmetic, not a regression estimate.',
      prStripWaiting: 'The day-move strip needs two observations — the live snapshot and the last stored day before today; it waits until both exist.',
      prChartTitle: 'The Emami and Bahar premium chart',
      prMeltLabel: 'melt',
      prBoundaryLabel: 'live compute begins',
      prHonestyLine: 'The honesty line: {from} to {to} ({n} days) is reconstructed from TGJU’s own daily closes; from then on, computed live from our own snapshots.',
      prDecileTitle: 'The premium’s place in its own window',
      prDecileLine: '{coin}: {pct} — {band} its {from} → {to} window ({n} days, today excluded).',
      prDecileWaiting: '{coin}: the statistical basis is {n} days; the decile lights at 30 and sharpens as the series grows.',
      prDecileBand: 'The Emami band over the same window: min {min} · p10 {p10} · median {median} · p90 {p90} · max {max}.',
      prBandTop: 'top {p}% of',
      prBandBottom: 'bottom {p}% of',
      prBandMid: 'mid-range of',
      prMethod: 'Daily capture: each night around 00:03 Tehran time, the day’s last snapshot becomes one row; the historical stretch is reconstructed from TGJU’s own daily closes of the four legs (ounce, free dollar, Emami, Bahar) with the premium COMPUTED from those closes — never scraped as a claim. The melt formula prints on the bridge card above.',
      prUnavailable: 'The premium history could not be read yet.',
      /* GPE R31 / F12 (2026-11-19, S17): the TIME MACHINE — Zone C's
       * collapsed Advanced control over the readings archive (s6/01
       * zone 4 · s7/03 §3.4 the meter-era boundary, binding: 2016+,
       * never a pre-era verdict). The verdict + counts + lane words
       * REUSE the hero's own corpus-pinned keys (heroVerdict* ·
       * heroCount* · laneState* — never a parallel vocabulary). */
      tmTitle: 'The time machine',
      tmSubtitle: 'Any past day’s meter reading, under the then-current voter table — the only historical-meter surface.',
      tmEraNote: 'The meter’s era begins November 2016 — the stored series’ own window — and no earlier meter state exists or is ever synthesized. The reading shown is the balance as the meter would have read it that day, under the voter table current AT that date; no live meter existed before late October 2026, so earlier days ride the published backtest’s own frozen table.',
      tmPickLabel: 'Pick a day',
      tmLoading: 'Reading the archive…',
      tmAsOfExact: 'The meter as of {date}',
      tmAsOfBefore: 'The meter as of {row} — the last reading day on or before {picked}',
      tmVersionLine: 'Under the {version} voter table ({seats} seats)',
      tmProvenanceBackfill: 'Reconstructed from the stored series — the published backtest’s own machinery, no lookahead.',
      tmProvenanceLive: 'The day’s own snapshot — the page’s plane, captured live.',
      tmNoRow: 'No stored reading for {date} yet — the honest gap, never a guess.',
      tmUnavailable: 'The archive could not be read for {date} — please try again shortly.',
      /* GPE R32 / F23 (2026-11-19, S17): the forecast-accuracy
       * retrospective — Zone M's collapsed companion inside the
       * honest-record zone (s6/01 zone 14 · s4/02 §1d the extraction ·
       * the s17 M1 §3 record: every aggregate reproduces exactly). */
      frTitle: 'Even the consensus misses',
      frSubtitle: 'LBMA’s analyst survey under-forecast gold in {under} of {n} years — mean absolute miss {abs}.',
      frHeadline: 'The professionals’ published consensus missed gold’s actual average in {under} of {n} years (2010–2025): the mean miss is {mean}, the mean absolute miss {abs}. The numbers are LBMA’s own.',
      fr2025Line: '2025 — the biggest miss of the record: {miss} (consensus {forecast} vs actual {actual}).',
      frColYear: 'Year',
      frColForecast: 'Forecast',
      frColActual: 'Actual',
      frColMiss: 'Miss',
      frPendingCell: 'in progress',
      frMissConvention: 'Miss = (forecast − actual) ÷ actual. Negative = the consensus under-forecast the actual average price.',
      frPendingLine: '2026 in progress: the January consensus says ${forecast}; LBMA’s own July pulse revised the whole-year figure to ${revision} — both recorded with their own contexts, never reconciled.',
      frPairNote: 'Currena’s meter claims no forecasting edge — its own measured no-edge record sits above this card. This card exists to show what the professionals’ published consensus actually did, never to imply ours predicts better.',
      frSourceLine: 'Source: LBMA forecast survey — the performance page’s own chart data, extracted {date}.',
      frSourceLink: 'LBMA’s survey pages',
      /* GPE R33 / F26 (2026-11-19, S17): the "if you'd bought"
       * calculator — Zone O's collapsed Advanced card (s6/01 zone 16 ·
       * s6/03 zone O "year picker + stacked result rows at 390" ·
       * s1/07 §4 the SA precedent). Every window named at point of use;
       * the decile framing where the history supports it (the R19
       * posture); past returns are no guarantee of future results. */
      ibTitle: 'If you’d bought',
      ibSubtitle: 'Gold vs S&P vs Bitcoin vs silver, lump + $100-a-month, since the year you pick.',
      ibLoading: 'Reading the series…',
      ibWaiting: 'The month-end series arrives with the calculator’s one-time backfill — nothing is drawn here until it lands.',
      ibMethod: 'Lump: one purchase at the first month-end close. DCA: ${amount} at every month-end close, marked at the running month’s close. Both compute from our own stored month-end series — every window is named on its result row.',
      ibPickLabel: 'Since',
      ibFirstYearNote: 'from November',
      ibWindowLine: '{from} → {to} · {n} months',
      ibDcaLine: 'DCA: {invested} → {value} ({pct})',
      ibDecileLine: 'This window’s return: decile {d} of {n} same-length windows.',
      ibDecileWaiting: 'The decile lights at {min} same-length windows — this window has {n}.',
      ibNoWindow: 'No month-end close at or after this year yet — never a guess.',
      ibDisclaimer: 'Past returns are no guarantee of future results. This is a descriptive tool, not advice.',
      ibSourcesLine: 'Month-end closes {from} → {to}: gold, silver, Bitcoin from our own daily series; S&P 500 from the world board’s own Yahoo venue.',
      ibAssetGold: 'Gold',
      ibAssetSp500: 'S&P 500',
      ibAssetBtc: 'Bitcoin',
      ibAssetSilver: 'Silver',
      /* GPE R14: the buyers-table country names (the current cast's IMF
       * codes; an unmapped code renders the code itself — fail-closed). */
      cbCountries: {
      POL: 'Poland',
      CHN: 'China',
      UZB: 'Uzbekistan',
      KAZ: 'Kazakhstan',
      CZE: 'Czechia',
      BRA: 'Brazil',
      MYS: 'Malaysia',
      JOR: 'Jordan',
      AUS: 'Australia',
      KGZ: 'Kyrgyz Republic',
      SRB: 'Serbia',
      KHM: 'Cambodia',
      IDN: 'Indonesia',
      EZB: 'Azerbaijan',
      GEO: 'Georgia',
      GTM: 'Guatemala',
      PHL: 'Philippines',
      EGY: 'Egypt',
      IRQ: 'Iraq',
      IND: 'India',
      TUR: 'Türkiye',
      QAT: 'Qatar',
      RUS: 'Russia',
      ARE: 'United Arab Emirates',
      ARM: 'Armenia',
      SGP: 'Singapore',
      IRL: 'Ireland',
      },
      evidenceRising: 'rising',
      evidenceFalling: 'falling',
      evidenceHigh: 'high in its decade',
      evidenceLow: 'low in its decade',
      laneTally: '{firing} of {readable} drivers firing',
      laneTallyNone: 'No driver firing',
      laneSplit: '{supports} for, {pressures} against',
      laneStateFor: 'Leans for gold',
      laneStateAgainst: 'Leans against gold',
      laneStateNeutral: 'Not leaning',
      laneStateUnread: 'Couldn’t be read',
      laneStateSplit: 'Split: {supports} for, {pressures} against',
      /* GUX-S5 M2 (11 §5.3): the LaneBar's per-lane condition words — the
       * lane's OWN state in its natural vocabulary (relief/tight ·
       * stress/strong · elevated/calm · hot/cool · calm/elevated per the
       * S4 spec's five pairs), rendered in the lane's IMPACT ink (the
       * two-channel rule at lane level: the word names the condition,
       * the ink carries the relationship to gold). Neutral/unread keep
       * the relational words above (a lane firing under minimum has no
       * condition to name — honest over natural). */
      laneCondBorrowingCostsFor: 'Relief',
      laneCondBorrowingCostsAgainst: 'Tight',
      laneCondDollarFor: 'Stress',
      laneCondDollarAgainst: 'Strong',
      laneCondStressFor: 'Elevated',
      laneCondStressAgainst: 'Calm',
      laneCondInflationFor: 'Hot',
      laneCondInflationAgainst: 'Cool',
      laneCondFlowsFor: 'Calm',
      laneCondFlowsAgainst: 'Elevated',
      laneCondSplit: 'Split ({supports}·{pressures})',
      /* GUX-S5 M2 (11 §6.4, S4-D7): the ONE AsOfChip freshness grammar —
       * a suffix word, no icons, no new colors (data-quality never
       * borrows market-signal hues); the cache qualifier keeps the
       * shipped pricesAsOfLastSuccessful wording. */
      asOfChipTime: 'as of {time}',
      asOfChipFresh: 'fresh',
      asOfChipDelayed: 'delayed',
      asOfChipStale: 'stale',
      asOfChipWaiting: 'waiting',
      asOfChipCache: 'last successful',
      /* GUX-S5 M3 (11 §10, 08 §8.4): the BriefingCard's own vocabulary.
       * The headline is the PRESENT-TENSE conditions statement (never a
       * forecast); the summary spine is Q1's container — the shipped
       * 7-state outlook line renders inside until the owner answers;
       * the horizon chip and scenario row render NOTHING until Q2. */
      /* GUX-S7 M1 (the owner's Q1 answer B, 2026-11-20): the five-state
       * CONDITIONS word — 08 §8.1's reviewed drafts, verbatim. The shared
       * 7-to-5 fold lives in outlook-five-state.ts (both the gold page's
       * BriefingCard and the /global Gold Balance tile render these keys). */
      fiveStateStronglySupport: 'Conditions strongly support gold',
      fiveStateModeratelySupport: 'Conditions moderately support gold',
      fiveStateMixedOrUnclear: 'Conditions are mixed or unclear',
      fiveStateModeratelyPressure: 'Conditions moderately pressure gold',
      fiveStateStronglyPressure: 'Conditions strongly pressure gold',
      briefKicker: 'BRIEFING',
      briefHeadlineFor: 'Gold: conditions lean with it',
      briefHeadlineAgainst: 'Gold: conditions lean against it',
      briefHeadlineMixed: 'Gold: conditions are mixed',
      briefHeadlineSparse: 'Gold: not enough readings to say',
      briefReasonsTitle: 'Why',
      briefChangeTitle: 'What could change this',
      briefChangeNarrow: 'A small shift in {lane} could move this balance',
      briefChangeFallback: 'The picture will move as fresh readings arrive',
      briefEvidenceAligned: 'Evidence: broadly aligned',
      briefEvidenceMixed: 'Evidence: mixed',
      briefEvidenceLimited: 'Evidence: limited',
      /* GUX-S5 M3 (11 §5.1): the CompositionStack's conditions header. */
      conditionsHeading: 'Conditions',
      conditionsSubheading: 'What supports and what pressures gold today',
      stackInspectInstrument: 'Inspect the instrument',
      stackLedgerLink: 'Inspect all 37 voters',
      seatLink: 'Open indicator',
      /* GUX-S5 M3b (12 §3.1 row 4.1): the hero price block's HouseTimeSeries
       * spark — the series named per C1, the window's own true span, the
       * signed change in return ink; the honest waiting/unavailable lines. */
      sparkSeriesName: 'XAUUSD spot · daily closes',
      sparkWindowLabel: '{n} bars · {from} → {to}',
      sparkAria: 'Gold spot price over the last {n} daily closes (~{months} months): {change} from {from} to {to}.',
      sparkUnavailable: 'The price chart could not be read yet.',
      /* GUX-S5 M4 (11 §7.2/§7.3 + 12 §1): the record sheet's chrome +
       * the SeatMark's aria/annotation words. The sheet's CONTENT is the
       * 09 records' own (the content module); these are the UI frame
       * words only — every record word stays the authored copy. */
      sheetClose: 'Close',
      sheetOpenLabel: 'Open the record',
      sheetDeepWaiting: 'Loading the record…',
      sheetWhatWhyTitle: 'What it measures · why it matters',
      sheetRisesTitle: 'When it rises',
      sheetFallsTitle: 'When it falls',
      sheetAnalogyTitle: 'In everyday terms',
      sheetTechnicalTitle: 'Technical detail',
      sheetTechName: 'Technical name',
      sheetRawValue: 'Latest value',
      sheetSource: 'Source',
      sheetAsOf: 'as of {date}',
      sheetReferencePeriod: 'Reference period',
      sheetFiringRule: 'Firing rule',
      sheetVisualReading: 'How to read the chart',
      sheetRelations: 'Related indicators',
      markBandAria: 'Sits at {p} of its 10-year range',
      markSignedAria: 'Reading {v} around the zero line',
      markShareAria: 'A share of {v} of 100',
      markNoBand: 'No 10-year range published for this series yet',
      markModelEstimate: 'model estimate',
      markYoyBasis: 'The band is over the year-over-year series',
      markStepped: 'A stepped policy-rate series',
      markZoneAria: 'The shaded zone is the 20th–80th percentile of the last 10 years',
      /* GUX-S5 M5 (the master plan's sticky-nav foundation, F-03): the
       * section chips — the page's own anchor names, short. */
      navAria: 'Gold page sections',
      navBriefing: 'The briefing',
      navBridge: 'Iran bridge',
      navSignals: 'Signals',
      navLanes: 'Five forces',
      navRatios: 'Ratios & context',
      navHistory: 'History & notes',
      /* GUX-S6 M1 (the relationship explorer, 12 §5 over 10 §5): the
       * section's chrome words only — the one-liners themselves are the
       * record module's own content (gold-relationships.ts, 10 §3's
       * authored copy), never dictionary strings. */
      navRelations: 'Relationships',
      relAria: 'How gold’s forces connect',
      relTitle: 'How the forces connect',
      relIntro:
        'The conventional relationships this page’s meter encodes — what tends to move with gold, through which channel, and under which conditions. Each connection states its own evidence class: a mechanism is not a proven cause, and an observed pattern is not a law.',
      relFilterAria: 'Filter by evidence class',
      relFilterAll: 'All',
      relClassM: 'M · mechanism',
      relClassC: 'C · correlation',
      relClassX: 'X · conditional',
      relClassK: 'K · documented',
      relConditionsApply: 'conditions apply',
      relCanvasToggle: 'Show the map view',
      relCanvasAria: 'The relationship map — gold at the centre, its forces around it. The list below carries every connection in full.',
      relCanvasNote: 'The map is a reading aid; every connection’s full text lives in the list.',
      relLegendTitle: 'Reading the connections',
      relLegendM: 'M · mechanism — a solid line: an economically reasoned channel (“the channel works through…”), not a law.',
      relLegendC: 'C · correlation — a dashed line: a historically documented association, never a cause.',
      relLegendX: 'X · conditional — a flagged line: the direction or strength depends on the regime; the break episodes are named in the record.',
      relLegendK: 'K · documented — the heaviest line: a causal statement with the evidence named inline.',
      relLegendBlocked: 'ETF flows ↔ gold — explained conceptually; no data under licence (never drawn as a charted connection).',
      relHonestyNote:
        'These are the conventional relationships the meter encodes — measured against gold’s actual moves, the 37-voter table showed no directional edge (sign agreements 46.8% at 5 days · 42.2% at 20 · 32.7% at 60 trading days — all below a coin flip).',
      relNodeGold: 'Gold',
      relNodeInflation: 'Inflation & expectations',
      relNodeCbDemand: 'Central-bank demand',
      relNodeEtfFlows: 'ETF flows',
      /* The lane names + one-sentence intros (the corpus's own, pinned). */
      laneBorrowingCosts: 'Interest rates & borrowing costs',
      laneDollar: 'The US dollar',
      laneStress: 'Market stress & uncertainty',
      laneInflation: 'Inflation & inflation expectations',
      laneFlows: 'Trader positioning & flows',
      laneIntroBorrowingCosts: 'What cash pays to hold — when interest beats inflation by a wide margin, gold has a tough rival.',
      laneIntroDollar: 'Gold is priced in dollars — a stronger dollar usually makes gold more expensive everywhere else.',
      laneIntroStress: 'When money is frightened, it often runs to gold; calm markets take that bid away.',
      laneIntroInflation: 'Gold is bought as an inflation hedge — the hotter prices and expectations run, the stronger the case people make for it.',
      laneIntroFlows: 'What futures traders are doing with gold right now — very crowded bets can be fragile.',
      /* The 37 voter seat names (compact forms — the corpus's own). */
      voterNames: {
        'real-yield-10y': 'Real yields',
        us10y: 'US 10-year yield',
        us30y: 'US 30-year yield',
        'fed-target': 'Fed funds target',
        'fed-expectations': 'Fed expectations',
        'ecb-dfr': 'ECB deposit rate',
        'real-yield-5y': 'Real yield (5y)',
        'dollar-basket': 'Dollar basket',
        usdjpy: 'USD/JPY',
        'us-japan-10y-gap': 'US−Japan 10y gap',
        'usd-reserve-share': 'USD reserve share',
        'nyfed-custody': 'Foreign custody at the NY Fed',
        'dollar-broad': 'Dollar (broad)',
        'dollar-eme': 'Dollar (EME)',
        'stress-stlfsi': 'STLFSI',
        nfci: 'NFCI',
        vix: 'VIX',
        'gold-silver': 'Gold/silver ratio',
        'term-premium-10y': '10-year term premium',
        ebp: 'Excess bond premium',
        'michigan-sentiment': 'US consumer mood',
        'gpr-daily': 'Geopolitical risk (7-day)',
        'epu-us': 'US policy uncertainty',
        'sp500-breadth-ratio': 'S&P 500 breadth',
        'bank-stress': 'Bank stress',
        'us-cpi-yoy': 'US CPI',
        'us-pce-core-yoy': 'US core PCE',
        'euro-hicp': 'Euro HICP',
        'breakeven-5y5y': '5y5y breakeven',
        'breakeven-tilt': 'Inflation tilt',
        t5yie: '5-year breakeven',
        'michigan-1y-expectations': '1-year inflation expectations',
        'm2-us': 'US money supply',
        'us-deficit-12m': 'US 12-month deficit',
        'michigan-5y-expectations': '5–10y inflation expectations',
        'cftc-gold-positioning': 'Gold positioning (COT)',
        'cftc-gold-gross-long': 'Gold long positioning (COT)',
      },
      /* The context cards (D-27) — names pinned to the indicators corpus,
       * units to the units corpus, positions + statuses to the ui corpus. */
      contextAria: 'The gold picture’s ratio and flow cards',
      ratiosTitle: 'Ratios',
      flowsTitle: 'Flows & positioning',
      cardNames: {
        'gold-usd': 'Gold price (ounce)',
        'gold-silver': 'Gold’s price versus silver',
        'gold-btc': 'Bitcoin priced in gold (BTC per ounce)',
        'gold-aud': 'Gold price in Australian dollars',
        'gold-oil-ratio': 'Gold measured in oil',
        'gold-platinum': 'Gold to platinum ratio',
        'real-gold-price': 'The real gold price (CPI-deflated)',
        'copper-gold': 'Copper’s price versus gold',
        'gold-equities-ratio': 'Gold vs equities (GLD/SPY)',
        'cftc-gold-positioning': 'Trader positioning in gold',
        'cftc-gold-gross-long': 'Gold long positioning (COT)',
        'sge-gold-withdrawals': 'SGE gold withdrawals (monthly)',
        'swiss-gold-flow': 'Swiss gold imports (monthly)',
        'shanghai-gold-premium': 'Shanghai gold premium',
      },
      unitUsd: 'US$',
      unitAud: 'A$',
      unitPercent: '%',
      unitRatio: 'ratio',
      /* GPE R02 (wave 0, GPE-S2-02 HIGH): the SGE-withdrawals + Swiss-flow
       * cards' values are plain TONNES (92, 228) — this pair deliberately
       * DIVERGES from the insights corpus's units.tonnes ('m tonnes'),
       * which is China-steel vocabulary (values genuinely in millions of
       * tonnes). The gold page's copy-pin test pins the divergence. */
      unitTonnes: 'tonnes',
      positionLow: 'low',
      positionTypical: 'typical',
      positionHigh: 'high',
      positionWordLine: '{word} · {band} of the last 10 years',
      statusWarning: 'Needs attention',
      statusNormal: 'Normal',
      statusStale: 'Stale',
      statusCheckPending: "Can't tell right now",
      statusUnavailable: "Can't tell right now",
      statusContext: 'Context',
      valueUnavailable: 'Cannot read yet',
      /* The blocked quartet (§16 — honest notes, never cards). GPE R09 /
       * F13 (2026-11-18, s6/01 Zone L): each item states WHY it is absent
       * AND what the owner's lever is (C7 rule 5 — the honest wall explains,
       * never apologizes), plus the ONE link-out (#22, GPE-S2-22): the
       * public data-sources document carries the licence ladder + every
       * source's terms. The WGC CB line retires as Tier-2 lands (D7). */
      /* BD-S43 (2026-11-20, the owner-directed relocation): the footer-
       * positioned publication-notes disclosure's own summary label — the
       * one line a normal user sees at the page tail (collapsed); the
       * blocked quartet + the absent-count line + the link-out ride inside,
       * one tap away. */
      pubNotesSummary: 'Publication notes — why some readings are not shown',
      blockedTitle: 'Not published — blocked by licence or venue',
      blockedWgcEtf:
        'World gold ETF holdings — the WGC licence class requires prior written authorisation before display. The owner’s lever: the authorisation letter to the World Gold Council (info@gold.org), drafted and ready to send.',
      blockedWgcCb: 'Central-bank gold demand — the same WGC authorisation gate; the same letter is the owner’s lever.',
      blockedOfficial:
        'Official gold demand (PBoC/CBR) — the publishers’ own English pages moved, and nothing is shown until the new addresses are verified (fail-closed). The owner’s lever: the venue re-find, on the list.',
      blockedEtfShort:
        'Gold ETF short interest — no licence-clean venue exists today; unlocking it would take a new venue or negotiated terms.',
      blockedLearnMore:
        'Why every number on this page is safe to show: the licence ladder and each source’s terms, in the public data-sources document.',
      absentWhyLink: 'see why',
      /* The honest-record footnote (D-29). The measured note + link word
       * are the corpus's own, pinned; the sign-agreement line carries the
       * backtest's measured numbers (05-GOLD-INDICATORS §10). */
      honestTitle: 'The honest record',
      measuredNote:
        'Measured against gold’s actual moves over 2016 to 2026: the lean of these drivers showed no positive association with the next 5 to 60 days. If anything, readings against gold came before larger rises. It describes conditions, not direction.',
      measuredLink: 'Read the full backtest',
      signAgreement:
        'Measured sign agreements with gold’s next move (mature base): {d5} at 5 days · {d20} at 20 · {d60} at 60 trading days — all below a coin flip.',
      min2Note: 'A lane votes only when at least 2 of its voters fire (MIN2) — the calibration passed its pre-registered criteria twice.',
      noEdge: 'A descriptive conditions meter — no forecasting edge is claimed or implied.',
      /* ---- The Gold Positions section (TM23): the four strings its
       * component shipped hardcoded now ride the dictionary,
       * byte-identical, per house rule 5 (baseline-repair 2026-11-15).
       * The TM23 pd.commodities.positionsTitle/positionsPurpose pair
       * (added but never wired) stays queued in the copy manifest for
       * the owner's fa review. */
      positionsTitle: 'Gold Positions',
      positionsPurpose: 'How traders are positioned in the gold futures market — the CFTC Commitments of Traders report.',
      positionsCardTraderPositioning: 'Gold trader positioning',
      positionsCardGrossLong: 'Gold gross long positioning',
      /* GPE R03 (wave 0, GPE-S2-09 MED): the change line's window word —
       * the section speaks the WEEKLY CFTC report, so an unlabeled
       * '−8.8 pts' parses as week-over-week; the value is the 30-day
       * change. C1's series/window-named-at-point-of-use rule, honored
       * on an existing surface. */
      positionsChangeWindow: '30-day change',
    },
    worldMarkets: {
      title: 'World Markets',
      purpose: 'The state of world equities at a glance, plus the world’s risk backdrop.',
      summary:
        'The world-index map (16 country indexes, reused from today’s Insights page), Asia · Europe · Americas region grids with correction/bear statuses, and the world risk & liquidity cards.',
      /* ---- S7 (2026-11-08): the World Markets page's own copy (spec §6,
       * D-43 · D-47). The verdict + status + naming vocabulary below is
       * pinned byte-for-byte to the insights copy corpus (markets.* /
       * indicators / units / ui / signals.band) by
       * world-markets-copy-pin.test.ts — the page speaks the section's
       * own language, never a parallel vocabulary (D-48). Generic page
       * words (dataAsOf · fromCache · absentLine) REUSE pd.global's own
       * pinned keys. The fresh words (the rule line, the bear line, the
       * range-position labels, the section headings) are queued unreviewed
       * in the Persian copy manifest. */
      loadingLine: 'Reading the world’s markets…',
      errorTitle: 'The World Markets page is unavailable right now',
      errorText: 'The data did not arrive. Nothing is shown rather than a guess.',
      errorRetry: 'Try again',
      /* ---- The hero's status summary (spec §6 item 1: the §5.3 signal
       * + the RAW counts + the stated rule). The verdict words, the
       * measure labels, the correction-count and below-high lines are the
       * corpus's own, pinned. */
      statusAria: 'World stock markets status',
      verdictAria: 'World stock markets verdict: {label}, step {step} of 4',
      verdictBullish: 'Bullish',
      verdictMixed: 'Mixed',
      verdictBearish: 'Bearish',
      measureNormal: 'Stock markets: near their yearly highs',
      measureAttention: 'Stock markets: several well below their highs',
      measureUnusual: 'Stock markets: far below their highs',
      inCorrectionCount: '{n} of {count} markets in correction',
      belowHighLine: '{n} of {count} indices are at least 10% below their 52-week high',
      bearLine: '{n} of those are in a bear market — at least 20% below.',
      ruleLine:
        'Needs attention when {attention}+ of {count} markets are 10% or more below their 52-week high, unusual at {unusual}+; the S&P 500 or Nasdaq 100 alone can raise the level.',
      /* ---- The map adapter: the corpus's own markets.map block +
       * per-index naming, pinned byte-for-byte (the SAME drawing speaks
       * the SAME words as the legacy card — the WorldMapCopy contract). */
      map: {
        periodSwitchAria: 'Choose the period shown on the map',
        periodToday: 'Today',
        periodWeek: '1 week',
        periodMonth: '1 month',
        periodYear: '1 year',
        period3M: '3 months',
        period5Y: '5 years',
        periodWordToday: 'today',
        periodWordWeek: 'this week',
        periodWordMonth: 'this month',
        periodWordYear: 'this year',
        periodWord3M: 'over the past 3 months',
        periodWord5Y: 'over the past 5 years',
        open: 'Open',
        closed: 'Closed',
        noData: 'No data',
        oldData: 'Old data',
        stepFall: 'Fall',
        stepFlat: 'Flat',
        stepRise: 'Rise',
        cellD: '1D',
        cellW: '1W',
        cellM: '1M',
        cellY: '1Y',
        cell3M: '3M',
        cell5Y: '5Y',
        legendMoreDown: 'Bigger fall',
        legendMoreUp: 'Bigger rise',
        showingFrom: 'Showing data from {time}',
        srContext: '{country}, {step}',
        srPerf: 'performance:',
        srVal: 'last close',
        cardNameSsec: 'Shanghai',
        cardNameStoxx: 'Stoxx 50',
        cardNameTsx: 'S&P/TSX',
        cardNameNdx: 'Nasdaq',
        countryNames: {
          us: 'USA',
          ca: 'Canada',
          br: 'Brazil',
          gb: 'UK',
          fr: 'France',
          de: 'Germany',
          eu: 'Eurozone',
          in: 'India',
          hk: 'Hong Kong',
          cn: 'China',
          tw: 'Taiwan',
          kr: 'S. Korea',
          jp: 'Japan',
          au: 'Australia',
        },
      },
      /* The 16 index names + countries (the corpus's own, pinned). */
      entries: {
        n225: { name: 'Nikkei 225', latin: 'Nikkei 225', country: 'Japan' },
        asx200: { name: 'ASX 200', latin: 'ASX 200', country: 'Australia' },
        kospi: { name: 'KOSPI', latin: 'KOSPI', country: 'South Korea' },
        hsi: { name: 'Hang Seng', latin: 'Hang Seng', country: 'Hong Kong' },
        ssec: { name: 'Shanghai Composite', latin: 'Shanghai Composite', country: 'China' },
        taiex: { name: 'TAIEX', latin: 'TAIEX', country: 'Taiwan' },
        nifty50: { name: 'Nifty 50', latin: 'Nifty 50', country: 'India' },
        stoxx50: { name: 'Euro Stoxx 50', latin: 'Euro Stoxx 50', country: 'Eurozone' },
        dax: { name: 'DAX', latin: 'DAX', country: 'Germany' },
        cac: { name: 'CAC 40', latin: 'CAC 40', country: 'France' },
        ftse: { name: 'FTSE 100', latin: 'FTSE 100', country: 'United Kingdom' },
        sp500: { name: 'S&P 500', latin: 'S&P 500', country: 'United States' },
        ndx: { name: 'Nasdaq 100', latin: 'Nasdaq 100', country: 'United States' },
        dow: { name: 'Dow Jones', latin: 'Dow Jones', country: 'United States' },
        tsx: { name: 'S&P/TSX Composite', latin: 'S&P/TSX', country: 'Canada' },
        ibov: { name: 'Ibovespa', latin: 'Ibovespa', country: 'Brazil' },
      },
      /* ---- The region grids (spec §6 item 2). The column headers, the
       * trend + status words, the delayed tag and the local-currency
       * note are the corpus's own, pinned; the range-position labels are
       * fresh (the legacy table showed the from-high distance as a
       * number — the grid adds the range-position visual). */
      groups: {
        asia: 'Asia-Pacific',
        europe: 'Europe',
        americas: 'Americas',
      },
      gridsAria: 'The region grids — Asia, Europe, Americas',
      gridsHeading: 'By region',
      regionTableLabel: '{group} indices',
      thMarket: 'Market',
      thToday: 'Today',
      thWeek: '1 week',
      thMonth: '1 month',
      th3m: '3 months',
      thYear: '1 year',
      thRange52w: '52-wk range position',
      thTrend: '3m trend',
      thStatus: 'Status',
      trendUp: 'Up',
      trendFlat: 'Flat',
      trendDown: 'Down',
      statusNearHigh: 'Near its high',
      statusPullback: 'Pullback',
      statusCorrection: 'Correction',
      statusBear: 'Bear market',
      rangeSr: '{p} percent of its 52-week range',
      delayedTag: 'Delayed',
      localCurrencyNote: 'Returns in each market’s local currency.',
      /* ---- The world risk & liquidity section (spec §6 item 3 — the 9
       * placement homes). The card names, the unit words, the position +
       * band words and the status words are the corpus's own, pinned;
       * the section heading + intro are fresh. */
      riskAria: 'World risk and liquidity',
      riskTitle: 'World risk & liquidity',
      riskIntro: 'The risk backdrop behind world markets: geopolitical tension, and the money the biggest central banks create.',
      cardNames: {
        'gpr-index': 'Geopolitical Risk Index',
        'gpr-threats': 'Geopolitical Risk — threats',
        'gpr-acts': 'Geopolitical Risk — acts',
        'gpr-daily': 'Geopolitical Risk (7-day average)',
        'gpr-russia': 'Geopolitical Risk — Russia',
        'gpr-ukraine': 'Geopolitical Risk — Ukraine',
        'gpr-israel': 'Geopolitical Risk — Israel',
        'gpr-saudi': 'Geopolitical Risk — Saudi Arabia',
        'global-liquidity': 'Global liquidity (Fed + ECB + BoJ)',
      },
      unitIndex: 'index',
      unitUsdTr: 'trillion',
      unitUsd: 'US$',
      positionLow: 'low',
      positionTypical: 'typical',
      positionHigh: 'high',
      positionWordLine: '{word} · {band}',
      bandTop: 'top {p}%',
      bandMid: 'the middle',
      bandBottom: 'bottom {p}%',
      statusWarning: 'Needs attention',
      statusStale: 'Stale',
      statusCheckPending: "Can't tell right now",
      statusUnavailable: "Can't tell right now",
      valueUnavailable: 'Cannot read yet',
      /* ---- The briefing (2026-11-12 owner round: the legacy section's
       * editorial layer — the breadth headline, the two movers and the
       * regional tile explorer — restored on the standalone page). Every
       * word is the corpus's own, pinned byte-for-byte by
       * world-markets-copy-pin.test.ts (copy.markets + copy.ui.na); the
       * fresh section glue (the aria) is queued unreviewed in the Persian
       * copy manifest. ---- */
      briefingAria: 'World stock indices — the briefing',
      briefingHeading: 'World stock indices',
      breadthPeriod: '{period} performance',
      breadthUp: 'Indices up',
      breadthDown: 'Indices down',
      breadthFlat: 'Flat',
      flatBandNote: 'A move within ±1% reads as flat.',
      coverageNote: '{count} of {total} indices carry this period.',
      moverGain: 'Biggest gain',
      moverLoss: 'Biggest fall',
      moverPeriodLabel: 'Selected period: {period}',
      moversNone: 'No data for this period yet.',
      thFromHigh: 'From 52-week high',
      atHighTag: 'At its 52-week high',
      tileTagBelow: '{x}% below 52-week high',
      oldDataLine: 'Old data · {date}',
      noReadingAria: 'no data for this period',
      valueAria: '{name}, {country}: {value} over {period}',
      asOfLine: 'as of {date}',
      lastCloseLabel: 'Last close',
      high52wLabel: '52-week high',
      low52wLabel: '52-week low',
      chartAria: 'Closing values over the last 52 weeks',
      naWord: 'n/a',
      /* ---- The treemap (the 2026-11-12 treemap round: the TE-style
       * market heat map — tile size ≈ market cap, colour ≈ the selected
       * period's return). Fresh glue copy; the period words, the status
       * words and the entry names it borrows are the section's own
       * pinned keys. All fa strings queued in the Persian copy manifest
       * (the S7/S31 precedent). ---- */
      treemap: {
        heading: 'Market heat map',
        subtitle: 'Tile size ≈ market capitalization · colour ≈ {period} performance',
        legendAria: 'Colour scale: red at −{down}% through neutral at zero to green at +{up}% for the selected period.',
        canvasAria:
          'World markets heat map: {count} indices across 3 regions, tile size roughly market capitalization and colour the selected period performance',
        tileAria:
          '{name}, {country}: {value} over {period}, tile sized by roughly ${cap} trillion market cap, as of {date}',
        tileTooltip:
          '{name} ({country})\nLevel: {level}\n{period} change: {change}\nFrom 52-week high: {fromHigh} — {status}\nMarket cap: ≈ ${cap}T',
        footerNote:
          '{count} indices · colours saturate at ±{clamp}% for the selected period · select a tile for detail · illustrative demo market-cap data',
      },
    },
    usa: {
      title: 'USA',
      purpose: 'The American bulk — the deepest page, tiered by world-impact.',
      summary:
        'The five thematic gauge verdicts on top, about 72 cards in six tiers — from “the world watches” down to labor, liquidity, stress and valuation — the TIC board (who finances America), and the SPX/NDX/DOW section.',
      /* ---- S9 (2026-11-09): the USA page's own copy (D-29/D-30, spec §7
       * items 1–3). The card names, the unit words, the position + band
       * words and the status words are the corpus's own, pinned by
       * usa-copy-pin.test.ts; the verdict WORDS and the why-lines ride the
       * existing pd.global keys (one verdict language everywhere, D-48) —
       * never restated here. The strip questions + the tier headings +
       * the loading/error lines are fresh. */
      loadingLine: 'Reading the American numbers…',
      errorTitle: 'The USA page is unavailable right now',
      errorText: 'The data did not arrive. Nothing is shown rather than a guess.',
      errorRetry: 'Try again',
      strip: {
        title: 'America in five verdicts',
        intro:
          'The same five computed verdicts as the world scan — the engine’s own numbers, asked the American way.',
        qBorrowingCosts: 'Is borrowing getting costlier in America?',
        qInflationHeat: 'Are prices heating up in America?',
        qMarketStress: 'Is America’s market under stress?',
        qDollarStrength: 'Is the dollar standing strong?',
        qGrowthHealth: 'Is America’s economy growing?',
      },
      tier1: {
        title: 'The world watches',
        intro:
          'The seven numbers the planet reacts to first — the Fed, prices on both gauges, jobs, and the world’s benchmark yield.',
      },
      tier2: {
        title: 'Rates & the Fed',
        intro:
          'The curves, the funding rate, the mortgage rate, the auctions and the fiscal arithmetic behind the price of American money.',
      },
      /* ---- S10 (2026-11-09): the tier 3–6 copy (spec §7 items 4–7).
       * The 46 new card names + the 4 word units + the whole TIC block are
       * the corpus’s own, pinned byte-for-byte by usa-copy-pin.test.ts;
       * the tier headings + intros + the TIC tier title are fresh. */
      tier3: {
        title: 'Inflation',
        intro:
          'The price signals under the headline — core, median and sticky measures, wage growth, and what markets expect inflation to be.',
      },
      tier4: {
        title: 'Labor & growth',
        intro:
          'How Americans are doing — jobs, claims, openings, surveys, growth nowcasts, and the money supply.',
      },
      tier5: {
        title: 'Liquidity, stress & valuation',
        intro:
          'The plumbing and the mood — the Fed’s balance sheet, funding markets, the stress indices, and how expensive American shares look.',
      },
      tier6: {
        title: 'Who finances America',
        intro:
          'Foreign holders of US government debt — who holds it, who has been buying and who has been selling (the Treasury TIC data).',
      },
      cardNames: {
        'fed-target': 'The US central bank’s policy rate',
        'fed-expectations': 'What markets expect from the Fed',
        'us-cpi-yoy': 'US prices vs a year ago',
        'us-pce-core-yoy': 'The Fed’s preferred inflation gauge',
        'us-nfp': 'US jobs added or lost each month',
        'us-unemployment': 'US unemployment',
        us10y: 'What the US government pays to borrow for 10 years',
        'yield-curve-10y2y': 'The gap between 10-year and 2-year US borrowing',
        'yield-curve-10y3m': 'The gap between 10-year and 3-month US borrowing',
        'real-yield-10y': 'US 10-year interest after inflation',
        'real-yield-5y': 'US 5-year interest after inflation',
        'real-curve-10y5y': 'US real yield curve (10Y minus 5Y)',
        us30y: 'US 30-year Treasury yield',
        'us-2y': 'What the US pays to borrow for 2 years',
        sofr: 'The overnight funding rate',
        'mortgage-30y': 'The US 30-year home-loan rate',
        'nyfed-custody': 'Foreign official holdings at the New York Fed (weekly)',
        'us-deficit-monthly': 'US federal deficit (monthly)',
        'us-deficit-12m': 'US federal deficit (12-month total)',
        'treasury-auction-10y': 'US 10-year Treasury auction demand',
        'treasury-auction-10y-indirect': 'US 10-year auction indirect share',
        'treasury-auction-30y': 'US 30-year Treasury auction demand',
        'treasury-auction-30y-indirect': 'US 30-year auction indirect share',
        'rstar-us': 'US r-star (HLW estimate)',
        'debt-to-gdp': 'US federal debt to GDP',
        'govt-interest-revenue': 'The US government’s interest bill vs its income',
        "us-cpi-core-yoy": "Core inflation",
        "median-cpi": "US median inflation (Cleveland Fed)",
        "sticky-cpi": "US sticky-price inflation (Atlanta Fed)",
        "us-wages": "US wage growth",
        "t5yie": "Expected US inflation, five years ahead",
        "breakeven-5y5y": "Expected US inflation, five to ten years ahead",
        "breakeven-10y": "Expected US inflation, ten years ahead",
        "breakeven-tilt": "The market’s inflation tilt",
        "cpi-nowcast": "US CPI nowcast (Cleveland Fed)",
        "cpi-surprise": "US CPI surprise (print vs nowcast)",
        "michigan-5y-expectations": "US expected inflation, next 5–10 years (Michigan)",
        "michigan-1y-expectations": "Expected inflation next year",
        "initial-jobless-claims": "New unemployment claims",
        "continuing-claims": "Americans on unemployment benefits",
        "job-openings": "US job openings",
        "sahm-rule": "US recession alarm (Sahm rule)",
        "recession-probability": "US recession probability",
        "michigan-sentiment": "US consumer mood",
        "oecd-cli-us": "OECD leading indicator (US)",
        "philly-fed": "US factory survey (Philadelphia Fed)",
        "empire-state": "Empire State manufacturing survey",
        "cfnai": "US economic activity (Chicago Fed)",
        "gdpnow": "US growth nowcast (GDPNow)",
        "us-gdp-growth": "How fast the US economy is growing",
        "retail-sales": "US retail sales",
        "housing-permits": "US building permits",
        "epu-us": "US policy uncertainty (EPU)",
        "tpu-us": "US trade policy uncertainty",
        "m2-us": "The amount of money in the US economy",
        "walcl": "The Fed’s balance sheet",
        "tga": "US Treasury General Account",
        "reverse-repo": "Fed overnight reverse repo (RRP)",
        "bank-reserves": "US bank reserves at the Fed",
        "repo-stress": "Repo funding pressure (SOFR minus IORB)",
        "net-liquidity": "US net liquidity",
        "stress-stlfsi": "Stress in US money markets",
        "nfci": "US financial conditions",
        "vix": "Market fear gauge",
        "bank-stress": "The Fed’s discount window rate",
        "ebp": "Excess bond premium (EBP)",
        "ofr-fsi": "OFR Financial Stress Index",
        "sloos-ci-tightening": "Banks tightening business lending (SLOOS)",
        "term-premium-10y": "US 10-year term premium",
        "shiller-cape": "US share prices versus long-run earnings (Shiller CAPE)",
        "shiller-ecy": "Excess CAPE Yield (Shiller)",
        "sp500-breadth-ratio": "S&P 500 equal-weight vs cap-weight (ratio)",
      },
      unitPercent: '%',
      unitPoints: 'pts',
      unitRatio: 'ratio',
      unitUsdTr: 'trillion',
      unitUsdBn: 'bn',
      unitUsd: 'US$',
      unitIndex: 'index',
      unitClaims: 'claims',
      unitPermits: 'm permits a year',
      unitOpenings: 'm job openings',
      /* The TIC block — the REUSED section’s own words (S10’s tier-6
       * board), pinned byte-for-byte to the insights corpus’s copy.tic by
       * usa-copy-pin.test.ts (the world-markets map discipline: one drawing,
       * one vocabulary — D-48). */
      tic: {
          title: "Who holds US government debt",
          subtitle: "Foreign holdings of US Treasuries — who holds them, and who has been buying or selling",
          provenance: "Data for {month}, released {date}",
          staleBadge: "Data is more than 70 days old",
          empty: "Foreign-holdings data is being prepared. Check back after the next daily update.",
          headline: "Foreign holders owned {total} of US Treasuries in {month}. Japan held {japan}, {japanPhrase}. China held {china}, {chinaPhrase}.",
          phraseDown: "{amount} less than six months earlier",
          phraseUp: "{amount} more than six months earlier",
          phraseTrillion: "${n} trillion",
          phraseBillion: "${n} billion",
          splitTitle: "Foreign official vs private holders",
          officialWord: "Foreign official (central banks and governments)",
          privateWord: "Private investors",
          buyersTitle: "Largest net buyers, 12 months",
          sellersTitle: "Largest net sellers, 12 months",
          netBuyingWord: "net buying",
          netSellingWord: "net selling",
          chartTitle: "Japan and China, 24 months",
          chartSummary: "Japan went from {from} to {to} over the 24 months to {month} ({phrase}). China went from {cFrom} to {cTo} ({cPhrase}).",
          tableCaption: "Top foreign holders of US Treasuries, {month}",
          colCountry: "Country",
          colHoldings: "Holdings ($bn)",
          colShare: "Share",
          col1m: "1-month change",
          col12m: "12-month change",
          colNet: "Net buying/selling, 12m",
          colVal: "Price effect, 12m",
          colTrend: "Trend, 24 months",
          sortAria: "Sort by {column}",
          custodyBadge: "Custody hub",
          netVsValueNote: "Net buying/selling is real transactions (what investors actually bought or sold). The price effect is holdings changing value as market prices move. The two can point in different directions.",
          custodyCaveat: "Belgium, Luxembourg, the Cayman Islands, Ireland, the UK, Switzerland and Bermuda hold much that belongs to investors elsewhere: holdings are recorded where the securities are held, not who owns them.",
          custodyTooltip: "The US Treasury itself warns that these data are collected primarily from US-based custodians and cannot attribute ownership with complete accuracy: a security bought by a foreign resident but held in a custodial account in a third country is counted under that country, not the buyer.",
          flaggedNote: "Includes a month with an unusually large move — under review",
          netMonthsNote: "{n} of the last 12 months carry transactions data",
          showAllRows: "Show all {n} holders",
          showFewerRows: "Show fewer",
          countries: {
            "japan": "Japan",
            "united-kingdom": "United Kingdom",
            "china-mainland": "China",
            "belgium": "Belgium",
            "canada": "Canada",
            "cayman-islands": "Cayman Islands",
            "luxembourg": "Luxembourg",
            "france": "France",
            "ireland": "Ireland",
            "taiwan": "Taiwan",
            "switzerland": "Switzerland",
            "singapore": "Singapore",
            "hong-kong": "Hong Kong",
            "india": "India",
            "norway": "Norway",
            "brazil": "Brazil",
            "saudi-arabia": "Saudi Arabia",
            "korea-south": "South Korea",
            "united-arab-emirates": "United Arab Emirates",
            "bermuda": "Bermuda",
            "australia": "Australia",
          },
      },
      positionLow: 'low',
      positionTypical: 'typical',
      positionHigh: 'high',
      positionWordLine: '{word} · {band}',
      bandTop: 'top {p}%',
      bandMid: 'the middle',
      bandBottom: 'bottom {p}%',
      statusWarning: 'Needs attention',
      statusStale: 'Stale',
      statusCheckPending: "Can't tell right now",
      statusUnavailable: "Can't tell right now",
      valueUnavailable: 'Cannot read yet',
    },
    europe: {
      title: 'Europe',
      purpose: 'The European picture — EU members and non-EU members listed apart.',
      summary:
        'An EU section (ECB rate, euro-area inflation, AAA yields, Bund, BTP–Bund spread) and a separate United Kingdom section, plus the Europe zoom map and verified FRED fills.',
      /* ---- S12 (2026-11-09): the Europe page's own copy (D-15/D-33,
       * spec §8 items 1–4). The card names, the unit words, the position +
       * band words and the status words are the corpus's own, pinned by
       * europe-copy-pin.test.ts; the section headings + intros + the
       * loading/error lines + the cross-links copy are fresh. */
      loadingLine: 'Reading the European numbers…',
      errorTitle: 'The Europe page is unavailable right now',
      errorText: 'The data did not arrive. Nothing is shown rather than a guess.',
      errorRetry: 'Try again',
      eu: {
        title: 'European Union',
        intro:
          'The euro-area rates, prices and growth signals — the ECB’s policy rate, euro-area inflation, the safest and the German long ends, the Italy–Germany spread, and Germany’s leading indicator.',
      },
      uk: {
        title: 'United Kingdom',
        intro:
          'The non-EU leg — the Bank of England’s policy rate and the UK 10-year gilt yield. The FTSE 100 rides the Europe zoom map above.',
      },
      cardNames: {
        'ecb-dfr': 'The euro area’s policy rate',
        'euro-hicp': 'Euro-area inflation (yearly)',
        'euro-aaa-10y': 'What the safest euro-area governments pay for 10 years',
        'bund-10y': 'What the German government pays to borrow for 10 years',
        'btp-bund-spread': 'Italy–Germany 10-year spread',
        'oecd-cli-de': 'OECD leading indicator (Germany)',
        'gilt-10y': 'What the UK government pays to borrow for 10 years',
        'boe-rate': 'The UK central bank’s policy rate',
      },
      unitPercent: '%',
      unitPoints: 'pts',
      unitIndex: 'index',
      positionLow: 'low',
      positionTypical: 'typical',
      positionHigh: 'high',
      positionWordLine: '{word} · {band}',
      bandTop: 'top {p}%',
      bandMid: 'the middle',
      bandBottom: 'bottom {p}%',
      statusWarning: 'Needs attention',
      statusStale: 'Stale',
      statusCheckPending: "Can't tell right now",
      statusUnavailable: "Can't tell right now",
      valueUnavailable: 'Cannot read yet',
      crossLinks: {
        title: 'Currency pairs that move with Europe',
        intro:
          'The euro, the Swiss franc and the Turkish lira against the US dollar — their full detail cards live on the Currency Pairs page.',
        seePairs: 'See pairs',
      },
    },
    asiaPacific: {
      title: 'Asia & Pacific',
      purpose: 'The world’s growth engine region — organized by sub-region, not by theme.',
      summary:
        'Five sub-regions — China, Japan, Korea/Taiwan/Hong Kong, India and the Pacific (New Zealand) — plus the Asia zoom map and the three verified CPI cards (the IMF’s own CPI series, cross-checked against the national releases).',
      /* ---- S14 (2026-11-09): the Asia & Pacific page's own copy
       * (D-16/D-17/D-35/D-36, spec §9 items 1–6). The card names, the
       * unit words, the position + band words and the status words are
       * the corpus's own, pinned by asia-copy-pin.test.ts; the section
       * headings + intros + the loading/error lines + the cross-links
       * copy + the index-only notes are fresh. */
      loadingLine: 'Reading the Asia & Pacific numbers…',
      errorTitle: 'The Asia & Pacific page is unavailable right now',
      errorText: 'The data did not arrive. Nothing is shown rather than a guess.',
      errorRetry: 'Try again',
      china: {
        title: 'China',
        intro:
          'Factory activity, inflation, the OECD leading indicator, the China and Taiwan geopolitical-risk reads, property investment and crude steel output — the world’s growth engine at a glance.',
      },
      japan: {
        title: 'Japan',
        intro:
          'The 10-year Japanese government bond yield, the Bank of Japan’s policy rate, and yearly consumer-price inflation — the country’s full rates-and-prices trio (the inflation card reads the IMF’s own CPI series, verified against the national release).',
      },
      koreaTaiwanHk: {
        title: 'Korea · Taiwan · Hong Kong',
        intro:
          'Korea’s yearly consumer-price inflation (the IMF’s own CPI series, verified against KOSTAT’s release) — the Korea, Taiwan and Hong Kong markets (KOSPI, TAIEX and HSI) ride the Asia zoom map above.',
        indexNote:
          'KOSPI, TAIEX and HSI ride the zoom map above. The consumer-price read here is Korea’s national CPI, mirrored from the IMF’s own dataset.',
      },
      india: {
        title: 'India',
        intro:
          'India’s yearly consumer-price inflation (the IMF’s own CPI series, cross-checked against the MoSPI release) — the Indian market (NIFTY50) rides the Asia zoom map above.',
        indexNote:
          'NIFTY50 rides the zoom map above. The consumer-price read is India’s national CPI, mirrored from the IMF’s own dataset — a mirror that typically trails the official release by one to three months.',
      },
      pacificNz: {
        title: 'Pacific — New Zealand',
        intro:
          'New Zealand’s short-term interest rate and 10-year government bond yield, plus the S&P/NZX 50 index from the AU Markets board.',
      },
      nzxPreparing: 'NZX 50 data is being prepared. Check back after the next daily update.',
      nzxBoardLink: 'See the full AU Markets board on the Australia page',
      cardNames: {
        'china-pmi': 'Chinese factory activity',
        'china-cpi': 'China inflation (yearly)',
        'oecd-cli-cn': 'OECD leading indicator (China)',
        'gpr-china': 'Geopolitical Risk — China',
        'gpr-taiwan': 'Geopolitical Risk — Taiwan',
        'china-property-investment': 'China property investment (year-to-date, yearly)',
        'china-steel-output': 'China crude steel output (monthly)',
        'jgb-10y': 'What the Japanese government pays to borrow for 10 years',
        'boj-rate': 'The Japanese central bank’s policy rate',
        'japan-cpi': 'Japan inflation (yearly)',
        'korea-cpi': 'Korea inflation (yearly)',
        'india-cpi': 'India inflation (yearly)',
        'nz-short-rate': 'New Zealand short-term interest rate',
        'nz-10y': 'New Zealand 10-year government bond yield',
      },
      unitPercent: '%',
      unitPoints: 'pts',
      unitIndex: 'index',
      unitTonnes: 'm tonnes',
      positionLow: 'low',
      positionTypical: 'typical',
      positionHigh: 'high',
      positionWordLine: '{word} · {band}',
      bandTop: 'top {p}%',
      bandMid: 'the middle',
      bandBottom: 'bottom {p}%',
      statusWarning: 'Needs attention',
      statusStale: 'Stale',
      statusCheckPending: "Can't tell right now",
      statusUnavailable: "Can't tell right now",
      valueUnavailable: 'Cannot read yet',
      crossLinks: {
        title: 'Currency pairs and gold that move with Asia',
        intro:
          'The Chinese yuan and the Japanese yen against the US dollar, plus the Shanghai gold link — their full detail cards live on the Currency Pairs and Gold pages.',
        seePairs: 'See pairs',
        seeGold: 'See gold',
      },
    },
    australia: {
      title: 'Australia',
      purpose: 'The home market — the AU Markets board plus the five-gauge structure.',
      summary:
        'The AU Markets board (All Ordinaries, Small Ordinaries, the ASX 200 sectors, the four big banks, ASX 200 VIX, NZX 50) on top and 28 cards in the unchanged five-gauge structure, with the moved-out members linking to their new homes.',
      /* ---- S16 (2026-11-10): the Australia page's own copy (D-6/D-37,
       * spec §10 items 1–3). The card + seat names, the unit words, the
       * gauge questions/answers, the verdict/position/band/status words
       * and the whole boardCopy block are the corpus's own, pinned
       * byte-for-byte by australia-copy-pin.test.ts; the loading/error
       * lines, the board + world-risk section headings and the moved-out
       * chip words are fresh. */
      loadingLine: 'Reading the Australia numbers…',
      errorTitle: 'The Australia page is unavailable right now',
      errorText: 'The data did not arrive. Nothing is shown rather than a guess.',
      errorRetry: 'Try again',
      board: {
        title: 'The AU Markets board',
        intro:
          'The All Ordinaries, the Small Ordinaries, the ASX 200 sectors, the four big banks, the ASX 200 VIX and the S&P/NZX 50 — 19 symbols to the last close, in their local currencies.',
      },
      worldRisk: {
        title: 'World risk — Australia',
        intro:
          'The Australia column of the Geopolitical Risk index. The rest of the world-risk family lives on the World Markets page.',
      },
      movedOut: {
        label: 'Moved out of this gauge — their detail cards live on the other pages:',
        seePairs: 'See pairs',
        seeAsia: 'See Asia & Pacific',
        seeCommodities: 'See commodities',
        seeGold: 'See gold',
      },
      gauges: {
        'au-inflation-rates': {
          question: 'Are inflation and rates a problem?',
          answer: 'Australian inflation and the rates that respond to it.',
        },
        'au-households': {
          question: 'Are households under pressure?',
          answer: 'Mortgages, rents, wages and jobs: the household squeeze.',
        },
        'au-trade-currency': {
          question: 'How is trade and the currency?',
          answer: 'Exports, imports and the Australian dollar.',
        },
        'au-external': {
          question: 'How are Australia’s trade and partner links?',
          answer: 'Australia’s goods trade, its commodity links and the New Zealand connection.',
        },
        'au-activity': {
          question: 'Is the economy growing?',
          answer: 'The Australian economy’s pace: output, spending, construction, population and the labour market.',
        },
      },
      verdictWords: {
        relaxed: 'Stable',
        cautious: 'Cautious',
        stressed: 'Stressed',
        alarmed: 'Critical',
      },
      gaugeNotScored: 'not scored yet',
      gaugeNoReading: 'not enough data to read',
      inAlert: '{warnings} of {voting} indicators need attention',
      gaugeContextCount: '{n} context readings',
      staleReadingsBadge: '{n} of {total} readings out of date',
      cardNames: {
        'au-cpi': 'Australian prices vs a year ago',
        'au-trimmed-mean': 'Underlying inflation',
        'rba-expectations': 'What markets expect from the RBA',
        'au-10y': 'What Australia pays to borrow for 10 years',
        'au-us-10y-gap': 'The gap between Australian and US 10-year borrowing',
        'au-petrol-yoy': 'Petrol prices vs a year ago',
        'au-home-loan': 'The home-loan rate people actually pay',
        'au-wage-growth': 'Wage growth vs a year ago',
        'au-rent-yoy': 'Rent growth vs a year ago',
        'au-household-debt-arrears': 'Australian household debt versus income',
        'au-unemployment': 'The share of Australians without work',
        'au-home-values': 'Australian home prices',
        'au-housing-finance': 'New Australian home loans',
        'rba-cash-rate': 'Australia’s official interest rate',
        'au-deposit-rate': 'Savings rates (new term deposits)',
        'au-saving-ratio': 'The Australian household saving rate',
        'au-job-vacancies': 'Australian job vacancies',
        'terms-of-trade': 'Australia’s export prices vs import prices',
        'rba-fed-gap': 'The gap between Australian and US interest rates',
        'au-trade-balance': 'Australian goods trade balance',
        'au-gdp-growth': 'Australian economic growth (real GDP)',
        'au-household-spending': 'Australian household spending (annual change)',
        'au-building-approvals': 'Australian dwelling approvals',
        'au-population-growth': 'Australian population growth',
        'au-nom': 'Net overseas migration',
        'au-participation': 'Australian participation rate',
        'au-underemployment': 'Australian underemployment rate',
        'gpr-australia': 'Geopolitical Risk — Australia',
      },
      seatNames: {
        audusd: 'Australian dollar vs US dollar',
        audjpy: 'Australian dollar vs yen',
        audnzd: 'Australian dollar vs New Zealand dollar',
        'nz-short-rate': 'New Zealand short-term interest rate',
        'nz-10y': 'New Zealand 10-year government bond yield',
        'china-property-investment': 'China property investment (year-to-date, yearly)',
        'china-steel-output': 'China crude steel output (monthly)',
        'iron-ore': 'Iron ore price',
        'coal-aus': 'Australian coal price',
        'lng-japan': 'LNG price (Japan)',
        'gold-aud': 'Gold price in Australian dollars',
      },
      units: {
        percent: '%',
        points: 'pts',
        index: 'index',
        aud: 'A$',
        audBn: 'bn',
        audM: 'm',
        vacancies: 'k vacancies',
        dwellings: 'dwellings approved',
        personsK: 'k people',
      },
      positionLow: 'low',
      positionTypical: 'typical',
      positionHigh: 'high',
      positionWordLine: '{word} · {band}',
      bandTop: 'top {p}%',
      bandMid: 'the middle',
      bandBottom: 'bottom {p}%',
      statusWarning: 'Needs attention',
      statusStale: 'Stale',
      statusCheckPending: "Can't tell right now",
      statusUnavailable: "Can't tell right now",
      valueUnavailable: 'Cannot read yet',
      /* The REUSED AustralianMarkets drawing's copy contract — every key
       * pinned byte-for-byte to the corpus's own marketsAu block by
       * australia-copy-pin.test.ts (one drawing, one vocabulary, D-48 —
       * the S10 usa-tic-copy pattern). */
      boardCopy: {
        title: 'The Australian market up close',
        sectionLabel: 'Australian stock indices',
        subtitle: 'The All Ordinaries, the ASX 200 sectors, the big banks and the ASX 200 VIX to the last close',
        lastCloseBadge: 'Latest data · end of trading day',
        asOf: 'as of {date}',
        asx200Anchor: 'ASX 200 (on the world markets board)',
        asx200AnchorHint:
          'The ASX 200 itself sits with the world indices above; this section adds the All Ordinaries, the sectors, the banks and the VIX.',
        summaryLeading: 'Today the {leader} are leading the Australian market, up as much as {val}.',
        summaryLagging: 'The {laggard} are lagging, down as much as {val}.',
        summaryMixed:
          'The Australian market is mixed today: the {leader} are up as much as {val}, while the {laggard} are down as much as {val2}.',
        summaryCalm: 'The Australian market is steady today, with most sectors close to flat.',
        summaryNoReading: 'Australian market data is being prepared. Check back after the next daily update.',
        thIndex: 'Index',
        thToday: 'Today',
        thWeek: '1 week',
        thMonth: '1 month',
        thYear: '1 year',
        thFromHigh: 'From 52-week high',
        thClose: 'Last close',
        delayedTag: 'Delayed',
        oldData: 'Old data · {date}',
        localCurrencyNote: 'The Australian rows are in Australian dollars; the New Zealand row is in New Zealand dollars.',
        empty: 'Australian market data is being prepared. Check back after the next daily update.',
        groups: {
          broad: 'Broad indices',
          sectors: 'ASX 200 sectors',
          banks: 'The big four banks',
          volatility: 'Volatility',
          newzealand: 'New Zealand',
        },
        entries: {
          aord: 'All Ordinaries',
          axso: 'ASX Small Ordinaries',
          axfj: 'ASX 200 Financials',
          axmj: 'ASX 200 Materials',
          axej: 'ASX 200 Energy',
          axpj: 'ASX 200 A-REIT',
          axhj: 'ASX 200 Health Care',
          axij: 'ASX 200 Industrials',
          axnj: 'ASX 200 Communication',
          axdj: 'ASX 200 Consumer Discretionary',
          axsj: 'ASX 200 Consumer Staples',
          axuj: 'ASX 200 Utilities',
          axtj: 'ASX 200 Information Technology',
          cba: 'Commonwealth Bank',
          nab: 'National Australia Bank',
          anz: 'ANZ Group',
          wbc: 'Westpac',
          axvi: 'ASX 200 VIX',
          nz50: 'S&P/NZX 50',
        },
      },
    },
    /* ---- S8 (2026-11-08): the REGION ZOOM sections' own copy (the
     * four region pages' index/map sections, D-13/D-44). The titles and
     * the intro line are FRESH words, queued unreviewed in the Persian
     * copy manifest; every word INSIDE the map drawing is the S7
     * corpus-pinned pd.worldMarkets.map block through the one shared
     * adapter (world-map-copy.ts) — never restated here (D-48). */
    regionZoom: {
      titles: {
        us: 'US stock indexes',
        europe: 'European stock indexes',
        asia: 'Asia & Pacific stock indexes',
        australia: 'Australian stock indexes',
      },
      introLine:
        'The same live world-markets map, zoomed to this region — the same board data, the same colours, the same words as the world view.',
    },
    commodities: {
      title: 'Commodities & Energy',
      purpose: 'Every commodity, exclusively here — energy, metals, agriculture and digital.',
      summary:
        'Energy · Metals · Agriculture · Digital groups with live prices, plus the trade-routes & supply section (chokepoints, SPR, crude stocks, GSCPI). Gold cross-links to the Gold page.',
      /* ---- S17 (2026-11-11): the Commodities page's own copy (D-2/D-19/
       * D-27/D-28/D-38/D-39/D-40, spec §11). The card names, the unit words
       * and the position/band/status words are the corpus's own, pinned
       * byte-for-byte by commodities-copy-pin.test.ts; the loading/error
       * lines, the group headings + intros and the gold cross-link words
       * are fresh. */
      loadingLine: 'Reading the commodities numbers…',
      errorTitle: 'The Commodities page is unavailable right now',
      errorText: 'The data did not arrive. Nothing is shown rather than a guess.',
      errorRetry: 'Try again',
      groups: {
        energy: {
          title: 'Energy',
          intro: 'Oil, gas, LNG and coal prices, plus US crude stocks, the strategic reserve and field production.',
        },
        metals: {
          title: 'Metals',
          intro: 'Silver, platinum, copper and iron ore prices. The gold ratios (gold/silver, gold/platinum, gold/oil) stay on the Gold page.',
        },
        agriculture: {
          title: 'Agriculture',
          intro: 'The world food index and the two grain ground-truths — wheat and maize.',
        },
        digital: {
          title: 'Digital',
          intro: 'Bitcoin and the Crypto Fear & Greed index.',
        },
        'trade-routes-supply': {
          title: 'Trade routes & supply',
          intro: 'The five maritime chokepoints (Suez, Panama, Bab el-Mandeb, Malacca, Taiwan) and the Global Supply Chain Pressure Index.',
        },
      },
      goldCrossLink: {
        label: 'Gold and its ratios (gold/silver, gold/platinum, gold/oil) live on the Gold page',
        text: 'See gold',
      },
      positionsTitle: 'Gold Positions',
      positionsPurpose: 'How traders are positioned in the gold futures market — the CFTC Commitments of Traders report shows whether speculators are net long or net short, and where the current positioning sits in its historical range.',
      cardNames: {
        brent: 'Oil price (Brent)',
        wti: 'Oil price (WTI)',
        natgas: 'US natural gas price',
        'gas-europe': 'European natural gas price',
        'lng-japan': 'LNG price (Japan)',
        'coal-aus': 'Australian coal price',
        'eia-crude-stocks': 'US crude oil inventories',
        'us-spr': 'US strategic petroleum reserve',
        'us-crude-production': 'US crude oil production',
        'silver-usd': 'Silver price (ounce)',
        platinum: 'Platinum price (ounce)',
        'copper-usd': 'Copper price',
        'iron-ore': 'Iron ore price',
        'food-index': 'World food prices',
        wheat: 'Wheat price',
        maize: 'Maize price',
        'btc-usd': 'Bitcoin price',
        'crypto-fng': 'Crypto fear and greed',
        'chokepoint-suez': 'Suez Canal transits',
        'chokepoint-panama': 'Panama Canal transits',
        'chokepoint-bab-el-mandeb': 'Bab el-Mandeb transits',
        'chokepoint-malacca': 'Strait of Malacca transits',
        'chokepoint-taiwan': 'Taiwan Strait transits',
        gscpi: 'Global supply chain pressure',
      },
      units: {
        usd: 'US$',
        index: 'index',
        barrels: 'm barrels',
        'barrels-per-day': 'm barrels a day',
        transits: 'transits a day',
      },
      positionLow: 'low',
      positionTypical: 'typical',
      positionHigh: 'high',
      positionWordLine: '{word} · {band}',
      bandTop: 'top {p}%',
      bandMid: 'the middle',
      bandBottom: 'bottom {p}%',
      statusWarning: 'Needs attention',
      statusStale: 'Stale',
      statusCheckPending: "Can't tell right now",
      statusUnavailable: "Can't tell right now",
      valueUnavailable: 'Cannot read yet',
    },
    currencies: {
      title: 'Currency Pairs',
      purpose: 'The FX picture — rules first, the pair board second.',
      summary:
        'The seven rule lights (R1–R7) as the hero with plain-language explanations, the 11-pair board with moveRank and big-move flags, and the dollar-standing section.',
      /* ---- S18 (2026-11-11): the Currencies page's own copy (D-18/D-32/
       * D-41/D-42, spec §12). The rule-light names + headlines + everyday
       * explanations, the status/chip/nodata/progress words, the board's
       * period words + tags + pair names, the registry card names, the unit
       * words and the position/band/status words are the corpus's own,
       * pinned byte-for-byte by currencies-copy-pin.test.ts; the
       * loading/error lines, the section headings + intros and the
       * move-rank / 52-week words are fresh. */
      loadingLine: 'Reading the currency numbers…',
      errorTitle: 'The Currency Pairs page is unavailable right now',
      errorText: 'The data did not arrive. Nothing is shown rather than a guess.',
      errorRetry: 'Try again',
      rulesTitle: 'The seven rule lights',
      rulesIntro:
        'Seven relationships between the big currencies, stocks and gold — each a tendency that has often shown up around market worries, with its current reading. Tendencies, not predictions.',
      ruleLights: {
        r1: {
          name: 'Nervous or relaxed?',
          everyday:
            'When people get scared, they sell riskier money like the Australian dollar and buy the safer Japanese yen. This pair shows which way money is moving.',
          headlineWarning: 'Investors look nervous',
          headlineWatch: 'An early hint of nervousness',
          headlineSupportive: 'Investors look relaxed',
          headlineQuiet: 'No sign of nervousness',
        },
        r2: {
          name: 'Sudden yen jump',
          everyday:
            'Many investors borrow cheap yen to invest elsewhere (a “carry trade”). If the yen suddenly gets stronger, they must repay fast and sell their investments, which can hit stock markets worldwide.',
          headlineWarning: 'The yen is jumping and markets may shake',
          headlineWatch: 'The yen is very weak',
          headlineQuiet: 'No sudden yen moves',
        },
        r3: {
          name: 'Strong or weak dollar',
          everyday:
            'Oil, gold and a lot of loans are priced in US dollars. When the dollar gets stronger, they cost more for people who earn in other currencies.',
          headlineWarning: 'The dollar is getting much stronger',
          headlineSupportive: 'The dollar is getting much weaker',
          headlineQuiet: 'The dollar is moving normally',
        },
        r4: {
          name: 'Where does money hide?',
          everyday:
            'In a scare, people usually move money into US dollars because it feels safe. When even the dollar is sold, trust is shaky, and gold often rises.',
          headlineFlight: 'Money is running to the dollar',
          headlineWobble: 'Money is leaving even the dollar',
          headlineQuiet: 'No rush to safety',
        },
        r5: {
          name: 'China link',
          everyday:
            'China is the biggest buyer of Australia’s iron ore. When China’s economy slows, the Australian dollar and the Chinese yuan often weaken together.',
          headlineWarning: 'Worry about China’s demand',
          headlineWatch: 'An early hint of China worry',
          headlineSupportive: 'China’s demand looks healthy',
          headlineQuiet: 'No sign of China worry',
        },
        r6: {
          name: 'Europe worry',
          everyday:
            'The Swiss franc is a classic safe place for money. When Europeans get nervous they buy francs, so the euro falls against it.',
          headlineWarning: 'Investors are worried about Europe',
          headlineWatch: 'The euro is slipping against the Swiss franc',
          headlineQuiet: 'No sign of Europe worry',
        },
        r7: {
          name: 'Dollar or euro?',
          everyday:
            'When the euro falls against the dollar, it can be because the dollar is strong everywhere (a world story) or because the euro itself is weak (a Europe story). This card tells you which.',
          headlineDollarLed: 'Mostly a dollar story',
          headlineEuroLed: 'Mostly a euro story',
        },
      },
      statusActive: 'Active',
      statusWatching: 'Watching',
      statusQuiet: 'Quiet',
      chipNormal: 'Normal',
      chipAttention: 'Needs attention',
      chipUnusual: 'Unusual',
      noDataRow: 'Not enough data right now',
      barLabel: 'How close to the alarm',
      reliabilityDetail: 'Held in {k} of the last 13 weeks',
      downgradeCaution: 'The usual pattern has not been reliable lately.',
      boardTitle: 'The pair board',
      boardIntro:
        'The eleven pairs the rules read, each with its rate, the four period changes, its move rank among the past year’s moves, and the past 52 weeks. Gold crosses stay on the Gold page.',
      thPair: 'Pair',
      thRate: 'Rate',
      thToday: 'Today',
      thM1: '1 month',
      thM3: '3 months',
      thY1: '1 year',
      thMoveRank: 'Move rank (0–100)',
      weeks52Label: 'Past 52 weeks',
      bigMoveTag: 'Unusually large move',
      oldData: 'Old data · {date}',
      boardFooter: 'European Central Bank (ECB) reference rates, once a day. A pattern is a tendency, not a prediction.',
      fxEmpty: 'Currency data is being prepared. Check back after the next daily update.',
      pairNames: {
        eurusd: 'Euro vs US dollar',
        usdjpy: 'US dollar vs yen',
        gbpusd: 'Pound vs US dollar',
        usdchf: 'US dollar vs Swiss franc',
        usdcny: 'US dollar vs yuan',
        audusd: 'Australian dollar vs US dollar',
        audjpy: 'Australian dollar vs yen',
        eurjpy: 'Euro vs yen',
        eurchf: 'Euro vs Swiss franc',
        audcny: 'Australian dollar vs yuan',
        audnzd: 'Australian dollar vs New Zealand dollar',
      },
      pairsTitle: 'Pair context',
      pairsIntro:
        'The same pairs as registry cards — each with its 10-year position and freshness, the reading the rule lights are built on.',
      pairCardNames: {
        usdjpy: 'Dollar vs yen',
        'eur-usd': 'Euro per US dollar',
        usdchf: 'Dollar vs Swiss franc',
        usdcny: 'Dollar vs Chinese yuan',
        audusd: 'Australian dollar vs US dollar',
        audjpy: 'Australian dollar vs yen',
        audnzd: 'Australian dollar vs New Zealand dollar',
      },
      standingTitle: 'Where the dollar stands',
      standingIntro:
        'The dollar’s own position: the basket against six big currencies, the broad and emerging-market measures, the US-Japan rate gap, two pegged or pressured currencies, and the reserve share.',
      standingCardNames: {
        'dollar-basket': 'The dollar vs six big currencies',
        'dollar-broad': 'The dollar vs 26 currencies',
        'dollar-eme': 'The dollar vs emerging-market currencies',
        'us-japan-10y-gap': 'The gap between US and Japanese 10-year rates',
        usdtry: 'Dollar vs Turkish lira',
        usdaed: 'Dollar vs UAE dirham',
        'usd-reserve-share': 'USD share of world FX reserves',
      },
      units: {
        index: 'index',
        points: 'pts',
        percent: '%',
        try: '₺',
        aed: 'AED',
        jpy: '¥',
        eur: '€',
        chf: 'CHF',
        cny: 'CN¥',
        usd: 'US$',
        nzd: 'NZ$',
      },
      positionLow: 'low',
      positionTypical: 'typical',
      positionHigh: 'high',
      positionWordLine: '{word} · {band}',
      bandTop: 'top {p}%',
      bandMid: 'the middle',
      bandBottom: 'bottom {p}%',
      statusWarning: 'Needs attention',
      statusStale: 'Stale',
      statusCheckPending: "Can't tell right now",
      statusUnavailable: "Can't tell right now",
      valueUnavailable: 'Cannot read yet',
    },
    /** TM21: the Economic Linkages page — the dedicated home for the
     *  macroeconomic connection cards (all the "Together" connections
     *  in one place). */
    economicLinkages: {
      title: 'Economic Linkages',
      purpose: 'How indicators move together — the analytical connections between rates, commodities, currencies and growth across every region.',
      loading: 'Loading the economic linkages…',
    },
  },

  footer: {
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
  },

  /** Jalali month names: legacy renders English transliterations (jalaali-js) */
  jalaliMonths: [
    'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
    'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand',
  ] as readonly string[],
};

export type Dictionary = typeof en;
