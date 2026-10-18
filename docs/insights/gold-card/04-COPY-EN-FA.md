# 04 — Copy (English and Farsi)

**Context:** every string on the gold and silver cards. Voice: plain, calm, no jargon, no urgency. Sentence case in English. The card never gives advice; it describes conditions.

## Rules for the agent
1. Before using any Farsi string below, search the repo for existing Currena Farsi terms for the same concept (for example the status chips and the world-economy terms). If a term exists, use the existing term and keep the rest of the sentence.
2. Treat the Farsi strings as reviewed proposals. Put every Farsi string in the repo's i18n file, not in the component.
3. Use Persian digits and the Persian decimal separator (٫) and percent sign (٪) in Farsi. Use Jalali dates.
4. `{asset}` is the asset name: Gold / طلا, Silver / نقره. In English, always write it in lower case inside a phrase ("Slight lean against gold", "make silver less attractive"). The segmented control and the tabs use title case ("Gold", "Silver").

## Verdict phrases
| Key | English | Farsi |
|---|---|---|
| slight_against | Slight lean against {asset} | کمی به ضرر {asset} |
| lean_against | Leaning against {asset} | به ضرر {asset} |
| strong_against | Strong lean against {asset} | به‌شدت به ضرر {asset} |
| slight_for | Slight lean for {asset} | کمی به نفع {asset} |
| lean_for | Leaning for {asset} | به نفع {asset} |
| strong_for | Strong lean for {asset} | به‌شدت به نفع {asset} |
| balanced | Balanced for {asset} | متعادل برای {asset} |
| insufficient | Not enough readings to call | برای قضاوت، داده کافی نیست |
| none | No readings available right now | فعلاً هیچ داده‌ای در دسترس نیست |
| error | We couldn't load this right now | فعلاً بارگذاری نشد |

## Subline
| Key | English | Farsi |
|---|---|---|
| subline | {confidence} · {read} of {total} factors read | {confidence} · {read} از {total} عامل خوانده شد |
| conf_high | High confidence | اطمینان بالا |
| conf_medium | Medium confidence | اطمینان متوسط |
| conf_low | Low confidence | اطمینان پایین |

## Beam and groups
| Key | English | Farsi |
|---|---|---|
| cap_supports | Supporting · {n} | حمایتی · {n} |
| cap_pressures | Pressuring · {n} | فشارآور · {n} |
| side_empty | None right now | فعلاً هیچ‌کدام |
| grp_neutral | Neutral · {n} | خنثی · {n} |
| grp_unread | Couldn't read · {n} | خوانده نشد · {n} |
| beam_alt | Balance scale: {s} supporting, {p} pressuring, {u} not read. {tilt} | ترازو: {s} حمایتی، {p} فشارآور، {u} خوانده‌نشده. {tilt} |
| tilt_p | Tilts toward pressuring. | به سمت فشارآور متمایل است. |
| tilt_s | Tilts toward supporting. | به سمت حمایتی متمایل است. |
| tilt_0 | Level. | تراز است. |

## Header and footnote
| Key | English | Farsi |
|---|---|---|
| tab_gold / tab_silver | Gold / Silver | طلا / نقره |
| updated | Updated {time} · {n} sources | به‌روزرسانی {time} · {n} منبع |
| footnote | Each factor counts equally. This is today's combined lean, not a forecast. | وزن همهٔ عوامل برابر است. این برآیند امروز است، نه پیش‌بینی. |

## Price context
| Key | English | Farsi |
|---|---|---|
| ctx_label | What {asset} is doing · context, not a weight | وضعیت خود {asset} · زمینه، نه وزنه |
| ctx_holding | holding near its 10-year high | ماندن نزدیک اوج ۱۰ سال اخیر |
| ctx_fading | near its 10-year high but fading | نزدیک اوج ۱۰ سال اخیر، اما در حال عقب‌نشینی |
| ctx_mixed | moving sideways | در حال نوسان |
| ctx_change | {pct} in 30 days | {pct} در ۳۰ روز |
| range_low / range_high | 10-yr low / high | کمینه ۱۰ ساله / بیشینه |

## Row text
| Key | English | Farsi |
|---|---|---|
| state_supports | Supporting | حمایتی |
| state_pressures | Pressuring | فشارآور |
| state_neutral | Neutral | خنثی |
| state_unread | Couldn't read | خوانده نشد |
| neutral_line | Sitting in its usual range. | در محدودهٔ معمول خود است. |
| asof | As of {date} · {source} | تا تاریخ {date} · {source} |
| unread_source_unavailable | couldn't read, source unavailable | خوانده نشد؛ منبع در دسترس نیست |
| unread_stale | couldn't read, last data {n} days ago | خوانده نشد؛ آخرین داده {n} روز پیش |
| unread_not_available_yet | not available yet | هنوز منبعی برای آن نداریم |
| last_known | Last known: {value} | آخرین مقدار: {value} |
| retry | Try again | تلاش دوباره |

## Flip line
| Key | English | Farsi |
|---|---|---|
| flip_balance_below | This would balance out if {name} fell below {x} | اگر {name} به زیر {x} برسد، شرایط متعادل می‌شود |
| flip_balance_above | This would balance out if {name} rose above {x} | اگر {name} به بالای {x} برسد، شرایط متعادل می‌شود |
| flip_ease_below | This would ease if {name} fell below {x} | اگر {name} به زیر {x} برسد، فشار کمتر می‌شود |
| flip_ease_above | This would ease if {name} rose above {x} | اگر {name} به بالای {x} برسد، فشار کمتر می‌شود |
For a supporting-heavy lean, use "ease" in the sense of "the lean weakens". Use the Farsi «شدت کمتر می‌شود» instead of «فشار کمتر می‌شود».

## Drivers: name, effect line, explanation
Effect lines use `{asset}` so one string serves gold and silver. Explanations are shared by both assets.
| Driver | Name EN / FA | Effect line (EN) | Effect line (FA) | Expanded explanation (EN) | Expanded explanation (FA) |
|---|---|---|---|---|---|
| real | Real yields / بازده واقعی | Higher real yields make {asset} less attractive. | بازده واقعی بالاتر، {asset} را کم‌جذاب‌تر می‌کند. | Real yields are what savers earn after inflation. A metal that pays no interest loses appeal when savers earn more. | بازده واقعی همان سودی است که سپرده‌گذار پس از کسر تورم می‌گیرد. فلزی که سودی نمی‌دهد، وقتی این سود بالاتر می‌رود جذابیت کمتری پیدا می‌کند. |
| infl | Inflation expectations / انتظارات تورمی | Expected price rises tend to support {asset}. | انتظار گرانی، معمولاً از {asset} حمایت می‌کند. | When people expect prices to keep rising, they often buy metals like gold and silver to protect their savings. | وقتی مردم انتظار دارند قیمت‌ها بالا برود، اغلب برای حفظ ارزش پس‌انداز خود فلزاتی مثل طلا و نقره می‌خرند. |
| stress | Market stress / تنش بازار | Nervous markets tend to send money to {asset}. | نگرانی بازار، معمولاً پول را به سمت {asset} می‌برد. | When markets are jittery, investors often treat precious metals as a safe place to wait. | وقتی بازارها پرتنش می‌شوند، سرمایه‌گذاران اغلب فلزات گران‌بها را جایی امن برای انتظار می‌دانند. |
| usd | US dollar / دلار آمریکا | A stronger dollar usually weighs on {asset}. | دلار قوی‌تر معمولاً بر {asset} فشار می‌آورد. | Metals are priced in dollars. When the dollar rises, they get more expensive for everyone else, which usually cools demand. | قیمت فلزات به دلار است. وقتی دلار بالا می‌رود، برای بقیهٔ دنیا گران‌تر می‌شوند و معمولاً تقاضا کم می‌شود. |
| ind | Industrial demand (silver only) / تقاضای صنعتی (فقط نقره) | Busy factories support {asset}. | کارخانه‌های پرکار از {asset} حمایت می‌کنند. | Silver is used in electronics and solar panels. Busy factories usually mean more demand. | نقره در الکترونیک و پنل خورشیدی به کار می‌رود. کارخانه‌های پرکار معمولاً یعنی تقاضای بیشتر. |
Write each effect line so it reads right for the state shown. Each line above is written for the state where the driver pushes the price the way the line says (real yields and the dollar pressure; inflation expectations, market stress and industrial demand support). When the state is the opposite, show the inverse line, for example "Lower real yields make {asset} more attractive." When the state is neutral, show "Sitting in its usual range." Add the inverse lines to the i18n file for every driver.

## Not on this card
Do not use "buy", "sell", "should", "opportunity", "warning" or exclamation marks. The legal disclaimer stays in the page footer.
