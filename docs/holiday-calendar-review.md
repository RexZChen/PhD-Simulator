# Holiday calendar review

Reviewed 2026-09-26 against the [U.S. Office of Personnel Management holiday list](https://www.opm.gov/frequently-asked-questions/pay-and-leave-faq/pay-administration/what-are-federal-holidays/).

The calendar now calculates the five movable holidays already present in the game for the displayed year: MLK Day and Washington’s Birthday (the game’s “Presidents’ Day”) use the third Monday of January and February; Memorial Day uses May’s last Monday; Labor Day uses September’s first Monday; Thanksgiving uses November’s fourth Thursday. Calculations use UTC, independent of the browser’s time zone. Rules use stable catalog positions rather than translated names.

Fixed-date holidays remain on their actual dates. They are not a federal employee observed-leave calendar: [OPM’s work-schedule guidance](https://www.opm.gov/policy-data-oversight/pay-leave/pay-administration/fact-sheets/holidays-work-schedules-and-pay) distinguishes actual holidays from substitute days off. The game does not infer campus closures from those federal employment rules.

Spring break, finals, commencement, visit days, winter break, lease turnover, and cohort arrival retain their authored fictional-campus dates. April 15 is labeled “Tax paperwork,” with an explicit campus-reminder description in English and Chinese; it does not assert a legal filing deadline for any player or year.

December coursework now explains finals and winter break; May explains finals and commencement. Summer retains its summer explanation. These date and explanation corrections leave teaching eligibility, time advancement, event selection, and financial effects unchanged. Holiday days only locate existing labels on the calendar grid. The separate closure-mail language correction below restores the existing English behavior in Chinese.

`tests/calendar.test.js` checks weekday and ordinal placement from 2028 through 2036, identical dates after EN→ZH→EN changes, fixed campus dates, leap-year month length, catalog immutability, and seasonal availability explanations.

The adjacent facilities-mail trigger previously compared translated holiday names with English strings. In Chinese that skipped both the closure message and its random draws. Thanksgiving, winter break, and spring break now carry stable IDs in both catalogs, and `monthlyMail` checks those IDs. Existing save data needs no migration because holiday definitions are loaded from the catalog. A deterministic regression compares closure eligibility, inbox structure, and final RNG state across both languages for 24 seeds in each closure month and an unrelated month. No other engine holiday-name comparisons were found.
