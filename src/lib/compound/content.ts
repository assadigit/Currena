/**
 * Compound Wealth — the bilingual copy (EN + fa), Currena's own voice.
 *
 * The wording follows the same discipline as the gold page's reviewed
 * dictionaries: short calm sentences, plain words, no term that needs
 * explaining on the default screen (spec §0.1.6), one stronger sentence
 * at the result. Farsi mirrors the English meaning in the site's own
 * register (formal-calm), with Persian digits and Jalali dates applied
 * at render time — never baked into these strings.
 */

export type Locale = "en" | "fa";

export interface CompoundCopy {
  dir: "ltr" | "rtl";
  /** The site chrome. */
  nav: {
    site: string;
    tagline: string;
    tools: string;
    langToggle: string;
    backToTools: string;
    home: string;
  };
  /** The tools index page. */
  index: {
    title: string;
    promise: string;
    eyebrow: string;
    open: string;
    alsoConverter: string;
    converterName: string;
    converterLine: string;
    converterCta: string;
  };
  /** The tool page. */
  tool: {
    title: string;
    promise: string;
    countryLabel: string;
    countries: { AU: string; US: string };
    headlineParts: {
      // "Investing {amount} a month for {years} years: you put in {putIn},
      // and it could grow to about {final} ({today} in today's money)."
      lead: string;
      youPutIn: string;
      growTo: string;
      todayMoney: string;
    };
    shareHeadline: string; // percent-mode lead sentence
    rangeWorse: string;
    rangeBetter: string;
    strongSentence: string;
    controls: {
      perMonth: string;
      forHowManyYears: string;
      investIn: string;
      decrease: string;
      increase: string;
      years: string;
      amountHint: string;
    };
    chart: {
      title: string;
      putInLabel: string;
      growthLabel: string;
      bandLabel: string;
      bandWhatIf: string;
      crossoverLabel: string;
      crossoverNever: string;
      otherAssets: string;
      cashLine: string;
      summary: string; // screen-reader text with {putIn} {final} {years}
    };
    tiles: {
      youPutIn: string;
      growthAdded: string;
      youCouldHave: string;
      futureMoney: string;
      todaysMoney: string;
      notYetInvested: string;
      /** W3: shown under the tiles whenever today's money is displayed.
       *  {x} = the inflation percent the plan is using (editable). */
      inflationCaption: string; // "Today's money uses average inflation of {x}% a year (last 20 years)."
    };
    milestones: {
      title: string;
      line: string; // "You pass {amount} in {date}."
      atAge: string; // "at age {n}"
      next: string; // "Next: {amount} in {date}"
      none: string;
    };
    buttons: {
      moreOptions: string;
      saveAsCard: string;
    };
    whatIf: {
      title: string;
      smallChanges: string;
      laterLabel: string;
      cashLabel: string;
      /** Amount mode — money terms, never "1% more" (W1). */
      moreMoney: string; // "Investing {step} more a month adds {x}."
      lessMoney: string; // "Investing {step} less loses {x}."
      /** % mode — percentage points. */
      morePct: string; // "Investing {up}% instead of {now}% adds {x}."
      lessPct: string; // "Investing {down}% instead of {now}% loses {x}."
      /** The optional salary suffix in Amount mode (kept short). */
      salarySuffix: string; // "(that is {p}% more of your salary)"
      later: string; // "Starting {n} years later costs you {x}."
      years: string[];
      cash: string; // "If you only save it as cash: about {x}."
      costs: string; // "Costs took {x} ({pct} of what you put in)."
      costsHint: string; // the buying-every-3-months hint
      neverInvests: string;
      pendingLine: string;
    };
    moreOptions: {
      title: string;
      aboutYou: string;
      salaryLabel: string;
      salaryHint: string;
      useShare: string;
      shareLabel: string;
      ageLabel: string;
      ageHint: string;
      startingLabel: string;
      startingHint: string;
      yearsOfSalary: string; // "That is about {n} years of your salary."
      costs: string;
      yearlyCostLabel: string;
      yearlyCostHint: string;
      feeLabel: string;
      feeHint: string;
      everyLabel: string;
      every: { m1: string; m3: string };
      rates: string;
      returnMode: string;
      modeAverage: string;
      modeCustomRate: string;
      modeCustomRange: string;
      customRateLabel: string;
      customLowLabel: string;
      customHighLabel: string;
      inflationLabel: string;
      inflationHint: string;
      increaseLabel: string;
      increaseHint: string;
      whatIfPointsLabel: string;
      whatIfPointsHint: string;
      datesAndCompare: string;
      startLabel: string;
      endLabel: string;
      datesClamped: string;
      compareTitle: string;
      compareAsset: string;
      compareRate: string;
      compareFinal: string;
      compareLow: string;
      compareHigh: string;
      compareCustom: string;
      customWord: string;
      reloadNote: string;
    };
    how: {
      title: string;
      method: string[]; // the four-line method
      overlapNote: string;
      totalReturnNote: string;
      priceOnlyNote: string;
      costNote: string;
      pendingNote: string;
      superNote: string;
      taxNote: string;
      fxNote: string;
      pastNote: string;
      sources: string;
      stale: string;
      /** W5: the heading above the per-asset index list. */
      indicesTitle: string;
      /** W3: the two inflation lines — the average used (follows the
       *  editable setting) and the latest 12-month figure. */
      inflationLine: string; // "Today's money uses the long-run average of {x}% a year."
      inflationRecentLine: string; // "Latest 12-month inflation: {y}% ({source}, {date})."
    };
    disclaimer: string;
    footer: {
      rights: string;
      madeInBrowser: string;
    };
    print: {
      choose: string;
      printOrPdf: string;
      phoneCard: string;
      hint: string;
      cardStyle: string;
      light: string;
      dark: string;
      close: string;
      title: string;
      planSummary: string;
      milestonesTitle: string;
      assumptionsTitle: string;
      assumptions: string[]; // lines with {inflation} {cost} {fee}
      growthRingsLabel: string;
      generatedOn: string;
      url: string;
      fallback: string;
    };
    phone: {
      title: string;
      planLine: string;
      next: string;
      hint: string;
      close: string;
      styleToggle: string;
      light: string;
      dark: string;
      footer: string;
      notAPromise: string;
    };
    errors: {
      clampMessage: string;
    };
  };
}

/* ------------------------------------------------------------------ */

export const COPY: Record<Locale, CompoundCopy> = {
  en: {
    dir: "ltr",
    nav: {
      site: "Currena",
      tagline: "Currency intelligence",
      tools: "Tools",
      langToggle: "فا",
      backToTools: "Tools",
      home: "Home",
    },
    index: {
      title: "Tools",
      promise: "Small, quiet tools for money questions.",
      eyebrow: "Currena tools",
      open: "Open",
      alsoConverter: "From the main site",
      converterName: "Currency Converter",
      converterLine: "Live rates and the Iranian toman converter.",
      converterCta: "Open on currena.ir",
    },
    tool: {
      title: "Compound Wealth",
      promise: "See what small, steady investing becomes.",
      countryLabel: "Country",
      countries: { AU: "Australia (AUD)", US: "USA (USD)" },
      headlineParts: {
        lead: "Investing {amount} a month for {years} years:",
        youPutIn: "you put in {putIn}",
        growTo: "and it could grow to about {final}",
        todayMoney: "(about {today} in today's money)",
      },
      shareHeadline: "Putting {share} of your salary aside for {years} years:",
      rangeWorse: "If it goes worse: about {x}.",
      rangeBetter: "If it goes better: about {x}.",
      strongSentence: "Small and steady beats big and late.",
      controls: {
        perMonth: "Per month",
        forHowManyYears: "For how many years",
        investIn: "Invest in",
        decrease: "Less",
        increase: "More",
        years: "years",
        amountHint: "Any amount works. Try yours.",
      },
      chart: {
        title: "The growth layer overtakes the money you put in",
        putInLabel: "Money you put in",
        growthLabel: "Growth",
        bandLowLabel: "worse",
        bandHighLabel: "better",
        bandLabel: "The range",
        bandWhatIf: "what-if range",
        crossoverLabel: "Growth overtakes your money in",
        crossoverShort: "overtakes",
        crossoverNever: "Growth never overtakes your money in this plan.",
        otherAssets: "Others",
        cashLine: "Cash",
        summary:
          "Line chart. Over {years} years you put in {putIn} and the plan could reach about {final}, {today} in today's money. Growth first overtakes what you put in {crossover}.",
      },
      tiles: {
        youPutIn: "You put in",
        growthAdded: "Growth added",
        youCouldHave: "You could have",
        futureMoney: "Future money",
        todaysMoney: "Today's money",
        notYetInvested: "{x} not yet invested",
        inflationCaption: "Today's money uses average inflation of {x}% a year (last 20 years).",
      },
      milestones: {
        title: "Along the way",
        line: "You pass {amount} in {date}.",
        atAge: "at age {n}",
        next: "Next: {amount} in {date}",
        none: "No milestone lines are crossed in this plan yet.",
      },
      buttons: {
        moreOptions: "More options",
        saveAsCard: "Save as card",
      },
      whatIf: {
        title: "What if…",
        smallChanges: "Small changes",
        laterLabel: "Starting later",
        cashLabel: "Cash comparison",
        /** Amount mode — money terms, never "1% more" (W1). */
        moreMoney: "Investing {step} more a month adds {x}.",
        lessMoney: "Investing {step} less loses {x}.",
        /** % mode — percentage points. */
        morePct: "Investing {up}% instead of {now}% adds {x}.",
        lessPct: "Investing {down}% instead of {now}% loses {x}.",
        /** The optional salary suffix in Amount mode (kept short). */
        salarySuffix: "(that is {p}% more of your salary)",
        later: "Starting {n} years later costs you {x}.",
        years: ["1", "3", "5"],
        cash: "If you only save it as cash: about {x}.",
        costs: "Costs took {x} ({pct} of what you put in).",
        costsHint: "Costs take a large share of each purchase. Buying every 3 months can help.",
        neverInvests: "With these numbers, the cost eats every purchase, so nothing gets invested.",
        pendingLine: "{x} is still waiting to be invested.",
      },
      moreOptions: {
        title: "More options",
        aboutYou: "About you",
        salaryLabel: "Monthly salary after tax",
        salaryHint: "Optional. Only used to work out the amount.",
        useShare: "Use a share of my salary instead",
        shareLabel: "Share of salary",
        ageLabel: "Your age now",
        ageHint: "Optional. Adds “at age N” to the milestones.",
        startingLabel: "Already invested",
        startingHint: "Treated as already in. No buying cost on it.",
        yearsOfSalary: "The result is about {n} years of your salary.",
        costs: "Costs",
        yearlyCostLabel: "Yearly cost of investing",
        yearlyCostHint: "An assumption. Change it. Not charged on cash.",
        feeLabel: "Cost per purchase",
        feeHint: "A flat fee each time you buy.",
        everyLabel: "How often I buy",
        every: { m1: "Every month", m3: "Every 3 months" },
        rates: "Rates",
        returnMode: "Return",
        modeAverage: "Average",
        modeCustomRate: "Custom rate",
        modeCustomRange: "Custom range",
        customRateLabel: "Rate a year",
        customLowLabel: "Low end",
        customHighLabel: "High end",
        inflationLabel: "Inflation",
        inflationHint: "Sets what “today's money” means.",
        increaseLabel: "Yearly increase of what you invest",
        increaseHint: "Raise what you put in as prices rise.",
        whatIfPointsLabel: "What-if points",
        whatIfPointsHint: "How far the worse/better lines sit from the middle.",
        datesAndCompare: "Dates and compare",
        startLabel: "Start month",
        endLabel: "End month",
        datesClamped: "We moved your dates to the allowed range.",
        compareTitle: "Compare assets",
        compareAsset: "Asset",
        compareRate: "Rate used",
        compareFinal: "Final amount",
        compareLow: "Low",
        compareHigh: "High",
        compareCustom: "Your custom rate",
        customWord: "Custom",
        reloadNote: "Everything resets when you reload.",
      },
      how: {
        title: "How is this worked out?",
        method: [
          "Your money is added at the end of each month and grows at one even yearly rate.",
          "The rate is the lower of the last 20 and last 30 years of real market figures.",
          "Costs are taken off the top every year, and a flat fee every time you buy.",
          "Today's money removes inflation, so you see what it would buy now.",
        ],
        overlapNote: "The 20-year and 30-year periods overlap, and both include good and bad years.",
        totalReturnNote: "Figures include dividends (total return) before tax.",
        priceOnlyNote: "One row is price only: {row}.",
        costNote: "The yearly cost is an assumption, not a fact. It is not charged on cash.",
        pendingNote: "Money waiting between purchases earns nothing.",
        superNote: "Employer super may already exist, so this is for extra money you invest on your own.",
        taxNote: "No taxes are included.",
        fxNote: "Exchange-rate effects are only those already inside the figures.",
        pastNote: "Past performance is not a promise.",
        sources: "Figures: {sources}. Checked by hand on {date}.",
        stale: "These figures may be out of date.",
        indicesTitle: "What each asset follows",
        inflationLine: "Today's money uses the long-run average of {x}% a year. You can change it under Rates.",
        inflationRecentLine: "Latest 12-month inflation: {y}% ({source}, {date}). Recent inflation can be higher or lower than the average.",
      },
      disclaimer: "Past returns are no guarantee of future results. This is a descriptive tool, not advice.",
      footer: {
        rights: "Currena · tools",
        madeInBrowser: "Made in your browser. Nothing was saved.",
      },
      print: {
        choose: "Save as card",
        printOrPdf: "Print or PDF",
        phoneCard: "Phone card",
        hint: "In the window that opens, choose Save as PDF.",
        cardStyle: "Card style",
        light: "Light",
        dark: "Dark",
        close: "Close",
        title: "Compound Wealth",
        planSummary: "{amount} a month · {years} years · {asset} · {rate} a year, {baseline}",
        milestonesTitle: "Along the way",
        assumptionsTitle: "The numbers behind this",
        assumptions: [
          "Growth rate: {rate} a year ({baseline})",
          "Figures: {sources}",
          "Yearly cost: {cost}",
          "Cost per purchase: {fee}",
          "Inflation: {inflation}",
        ],
        growthRingsLabel: "growth rings",
        generatedOn: "Made {date}",
        url: "currena.ir/tools/compound-wealth",
        fallback: "Printing is blocked here. Use your browser's Print menu instead.",
      },
      phone: {
        title: "Compound Wealth",
        planLine: "{amount} a month · {years} years",
        next: "Next: {amount} in {date}",
        hint: "Take a screenshot, then set it as your lock screen.",
        close: "Close",
        styleToggle: "Style",
        light: "Light",
        dark: "Dark",
        footer: "An illustration, not a promise · currena.ir",
        notAPromise: "An illustration, not a promise",
      },
      errors: {
        clampMessage: "That number is outside the allowed range, so we kept the nearest one.",
      },
    },
  },

  /* ---------------------------------------------------------------- */

  fa: {
    dir: "rtl",
    nav: {
      site: "کورنا",
      tagline: "هوش ارزی",
      tools: "ابزارها",
      langToggle: "EN",
      backToTools: "ابزارها",
      home: "خانه",
    },
    index: {
      title: "ابزارها",
      promise: "ابزارهای کوچک و آرام برای پرسش‌های پول.",
      eyebrow: "ابزارهای کورنا",
      open: "باز کن",
      alsoConverter: "از سایت اصلی",
      converterName: "مبدل ارز",
      converterLine: "نرخ‌های زنده و مبدل تومان ایران.",
      converterCta: "باز کردن در currena.ir",
    },
    tool: {
      title: "ثروت مرکب",
      promise: "ببینید سرمایه‌گذاریِ کوچک و پیوسته به چه چیزی تبدیل می‌شود.",
      countryLabel: "کشور",
      countries: { AU: "استرالیا (AUD)", US: "آمریکا (USD)" },
      headlineParts: {
        lead: "با سرمایه‌گذاری {amount} در ماه برای {years} سال:",
        youPutIn: "{putIn} وارد می‌کنید",
        growTo: "و ممکن است به حدود {final} برسد",
        todayMoney: "(حدود {today} به پول امروز)",
      },
      shareHeadline: "با کنار گذاشتن {share} از حقوق برای {years} سال:",
      rangeWorse: "اگر بدتر شود: حدود {x}.",
      rangeBetter: "اگر بهتر شود: حدود {x}.",
      strongSentence: "کم ولی پیوسته، از زیاد ولی دیر جلو می‌زند.",
      controls: {
        perMonth: "در ماه",
        forHowManyYears: "برای چند سال",
        investIn: "سرمایه‌گذاری در",
        decrease: "کمتر",
        increase: "بیشتر",
        years: "سال",
        amountHint: "هر عددی کار می‌کند. عدد خودتان را امتحان کنید.",
      },
      chart: {
        title: "لایهٔ رشد از پولی که وارد کرده‌اید جلو می‌زند",
        putInLabel: "پول واردشده",
        growthLabel: "رشد",
        bandLowLabel: "بدتر",
        bandHighLabel: "بهتر",
        bandLabel: "محدوده",
        bandWhatIf: "محدودهٔ فرضی",
        crossoverLabel: "رشد از پول شما جلو می‌زند در",
        crossoverShort: "عبور رشد",
        crossoverNever: "در این برنامه رشد هرگز از پول واردشده جلو نمی‌زند.",
        otherAssets: "سایر",
        cashLine: "پول نقد",
        summary:
          "نمودار خطی. در {years} سال، {putIn} وارد می‌کنید و برنامه ممکن است به حدود {final} برسد، یعنی {today} به پول امروز. رشد برای نخستین‌بار {crossover} از پول واردشده جلو می‌زند.",
      },
      tiles: {
        youPutIn: "واردشده",
        growthAdded: "رشدِ افزوده",
        youCouldHave: "ممکن است داشته باشید",
        futureMoney: "پول آینده",
        todaysMoney: "پول امروز",
        notYetInvested: "{x} هنوز سرمایه‌گذاری نشده",
        inflationCaption: "«پول امروز» با میانگین تورم {x}٪ در سال حساب می‌شود (۲۰ سال اخیر).",
      },
      milestones: {
        title: "در مسیر",
        line: "در {date} از {amount} عبور می‌کنید.",
        atAge: "در {n} سالگی",
        next: "بعدی: {amount} در {date}",
        none: "هنوز هیچ خط شاخصی در این برنامه رد نمی‌شود.",
      },
      buttons: {
        moreOptions: "گزینه‌های بیشتر",
        saveAsCard: "ذخیره به‌عنوان کارت",
      },
      whatIf: {
        title: "اگر…",
        smallChanges: "تغییرهای کوچک",
        laterLabel: "شروع دیرتر",
        cashLabel: "مقایسه با نقد",
        moreMoney: "{step} بیشتر در ماه، {x} اضافه می‌کند.",
        lessMoney: "{step} کمتر، {x} از دست می‌دهد.",
        morePct: "سرمایه‌گذاری {up}٪ به‌جای {now}٪، {x} اضافه می‌کند.",
        lessPct: "{down}٪ به‌جای {now}٪، {x} از دست می‌دهد.",
        salarySuffix: "(یعنی {p}٪ بیشتر از حقوق شما)",
        later: "شروع {n} سال دیرتر، {x} از دست می‌دهد.",
        years: ["۱", "۳", "۵"],
        cash: "اگر فقط به‌صورت نقد پس‌اندازش کنید: حدود {x}.",
        costs: "هزینه‌ها {x} بردند ({pct} از ورودی شما).",
        costsHint: "هزینه سهم زیادی از هر خرید را می‌برد. خرید هر ۳ ماه می‌تواند کمک کند.",
        neverInvests: "با این اعداد، هزینه همهٔ خریدها را می‌خورد و چیزی سرمایه‌گذاری نمی‌شود.",
        pendingLine: "{x} هنوز در انتظار سرمایه‌گذاری است.",
      },
      moreOptions: {
        title: "گزینه‌های بیشتر",
        aboutYou: "دربارهٔ شما",
        salaryLabel: "حقوق ماهانه پس از کسر مالیات",
        salaryHint: "اختیاری. فقط برای محاسبهٔ مبلغ استفاده می‌شود.",
        useShare: "به‌جای مبلغ، سهمی از حقوقم را کنار بگذارم",
        shareLabel: "سهم از حقوق",
        ageLabel: "سن شما",
        ageHint: "اختیاری. «در N سالگی» را به شاخص‌ها اضافه می‌کند.",
        startingLabel: "از قبل سرمایه‌گذاری‌شده",
        startingHint: "از قبل داخل حساب فرض می‌شود. هزینهٔ خرید ندارد.",
        yearsOfSalary: "نتیجه حدوداً {n} سال از حقوق شماست.",
        costs: "هزینه‌ها",
        yearlyCostLabel: "هزینهٔ سالانهٔ سرمایه‌گذاری",
        yearlyCostHint: "یک فرض است. تغییرش دهید. روی پول نقد اعمال نمی‌شود.",
        feeLabel: "هزینهٔ هر خرید",
        feeHint: "کارمزد ثابت برای هر بار خرید.",
        everyLabel: "هر چند وقت یک‌بار می‌خرم",
        every: { m1: "هر ماه", m3: "هر ۳ ماه" },
        rates: "نرخ‌ها",
        returnMode: "بازده",
        modeAverage: "میانگین",
        modeCustomRate: "نرخ دلخواه",
        modeCustomRange: "بازهٔ دلخواه",
        customRateLabel: "نرخ در سال",
        customLowLabel: "حد پایین",
        customHighLabel: "حد بالا",
        inflationLabel: "تورم",
        inflationHint: "معنای «پول امروز» را تعیین می‌کند.",
        increaseLabel: "افزایش سالانهٔ مبلغ ورودی",
        increaseHint: "همگام با گران شدن، بیشتر کنار بگذارید.",
        whatIfPointsLabel: "امتیازهای فرضی",
        whatIfPointsHint: "فاصلهٔ خط بدتر/بهتر از خط میانی.",
        datesAndCompare: "تاریخ‌ها و مقایسه",
        startLabel: "ماه شروع",
        endLabel: "ماه پایان",
        datesClamped: "تاریخ‌ها را به بازهٔ مجاز بردیم.",
        compareTitle: "مقایسهٔ دارایی‌ها",
        compareAsset: "دارایی",
        compareRate: "نرخ به‌کاررفته",
        compareFinal: "مبلغ نهایی",
        compareLow: "کم",
        compareHigh: "زیاد",
        compareCustom: "نرخ دلخواه شما",
        customWord: "دلخواه",
        reloadNote: "با بازخوانی صفحه همه‌چیز به حالت اول برمی‌گردد.",
      },
      how: {
        title: "این عدد چطور حساب شده؟",
        method: [
          "پول شما پایان هر ماه اضافه می‌شود و با یک نرخ سالانهٔ یکنواخت رشد می‌کند.",
          "نرخ، عدد کوچک‌ترِ ۲۰ سال و ۳۰ سال اخیرِ آمار واقعی بازار است.",
          "هزینه‌ها هر سال از بالا کسر می‌شوند و هر بار خرید یک کارمزد ثابت.",
          "«پول امروز» تورم را حذف می‌کند تا ببینید الان چه می‌خرد.",
        ],
        overlapNote: "دورهٔ ۲۰ ساله و ۳۰ ساله هم‌پوشانی دارند و هر دو سال‌های خوب و بد را دیده‌اند.",
        totalReturnNote: "اعداد شامل سود سهام (بازده کل) و پیش از مالیات است.",
        priceOnlyNote: "یک ردیف فقط قیمت است: {row}.",
        costNote: "هزینهٔ سالانه یک فرض است، نه یک واقعیت. روی پول نقد اعمال نمی‌شود.",
        pendingNote: "پولی که بین خریدها منتظر می‌ماند چیزی به دست نمی‌آورد.",
        superNote: "ممکن است سوپر کارفرما از قبل وجود داشته باشد؛ این ابزار برای پول اضافه‌ای است که خودتان سرمایه‌گذاری می‌کنید.",
        taxNote: "مالیات محاسبه نشده است.",
        fxNote: "اثر نرخ ارز فقط همان است که از قبل داخل اعداد است.",
        pastNote: "عملکرد گذشته یک وعده نیست.",
        sources: "اعداد: {sources}. دستی بازبینی شده در {date}.",
        stale: "ممکن است این اعداد از تاریخ افتاده باشند.",
        indicesTitle: "هر دارایی چه چیزی را دنبال می‌کند",
        inflationLine: "«پول امروز» با میانگین بلندمدت {x}٪ در سال حساب می‌شود. می‌توانید زیر «نرخ‌ها» تغییرش دهید.",
        inflationRecentLine: "تورم ۱۲ ماه اخیر: {y}٪ ({source}، {date}). تورم اخیر می‌تواند بیشتر یا کمتر از میانگین باشد.",
      },
      disclaimer: "بازده گذشته تضمینی برای آینده نیست. این یک ابزار توصیفی است، نه توصیه.",
      footer: {
        rights: "Currena · ابزارها",
        madeInBrowser: "در مرورگر شما ساخته شد. چیزی ذخیره نشد.",
      },
      print: {
        choose: "ذخیره به‌عنوان کارت",
        printOrPdf: "چاپ یا PDF",
        phoneCard: "کارت گوشی",
        hint: "در پنجره‌ای که باز می‌شود، «Save as PDF» را انتخاب کنید.",
        cardStyle: "سبک کارت",
        light: "روشن",
        dark: "تیره",
        close: "بستن",
        title: "ثروت مرکب",
        planSummary: "{amount} در ماه · {years} سال · {asset} · {rate} در سال، {baseline}",
        milestonesTitle: "در مسیر",
        assumptionsTitle: "اعداد پشت این نتیجه",
        assumptions: [
          "نرخ رشد: {rate} در سال ({baseline})",
          "منبع اعداد: {sources}",
          "هزینهٔ سالانه: {cost}",
          "هزینهٔ هر خرید: {fee}",
          "تورم: {inflation}",
        ],
        growthRingsLabel: "حلقه‌های رشد",
        generatedOn: "ساخته‌شده در {date}",
        url: "currena.ir/tools/compound-wealth",
        fallback: "چاپ اینجا مسدود است. از منوی چاپ مرورگرتان استفاده کنید.",
      },
      phone: {
        title: "ثروت مرکب",
        planLine: "{amount} در ماه · {years} سال",
        next: "بعدی: {amount} در {date}",
        hint: "یک اسکرین‌شات بگیرید و آن را صفحهٔ قفل گوشی‌تان کنید.",
        close: "بستن",
        styleToggle: "سبک",
        light: "روشن",
        dark: "تیره",
        footer: "یک تصویرِ آموزنده، نه یک وعده · currena.ir",
        notAPromise: "یک تصویرِ آموزنده، نه یک وعده",
      },
      errors: {
        clampMessage: "این عدد بیرون از بازهٔ مجاز است؛ نزدیک‌ترین عدد را نگه داشتیم.",
      },
    },
  },
};
