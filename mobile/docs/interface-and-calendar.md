# Interface, language and international planting calendars

## Implemented behavior

The existing Home layout is retained. The top-left profile control opens the profile, and the bottom duplicate is removed. Soil and climate cards open sheets with the available status, an explicit agricultural-analysis request and a NASA POWER source link. The rotations card opens the existing demonstration screen. Missing soil measurements or risk classifications remain unassessed; forecasts are not substituted for them.

The options menu opens settings, terms and local-session termination. Settings and the chat header share the same PT-BR/EN context across all screens and modals. Language preference uses the existing local storage library. User-written content and server-generated prose remain in their original language; static interface text, numbers and dates use the selected locale. No translation service receives profile text.

The camera uses the existing chat API rather than a fixed development IP and an unavailable /predict route. A completed capture transfers the response and session to chat without sending the same photo again. Secondary screens and sheets expose a visible back action; permission-denied camera states also preserve a back action.

## Calendar data and geographic coverage

GET /api/crop-calendar adapts the public FAO Crop Calendar API. It accepts country, first-level administrative region and the selected crop. Country and administrative metadata from an explicitly selected public city are retained through a field allowlist. There is no Brazil-only country default. Where country information is absent, notably device-derived points, a reverse lookup resolves only country and state from coordinates rounded to two decimal places.

The FAO service is international but incomplete. Supported crop identifiers are verified against its crop metadata, including generic maize rather than sweet corn. Unsupported crops, missing calendars, empty sessions and invalid dates do not produce invented sowing periods. An unresolved regional match requires explicit selection; another region is never silently chosen. Crop changes reset the selected window and cancel stale requests. The SVG sector and hands use the returned sowing dates, including cross-year periods and full-year records. The interval is green with live sprouts; the surrounding period is brown with seed shapes. Month labels sit outside the SVG and the leaf badge. Colors describe the source calendar interval, not a measured guarantee that planting is possible or impossible on a particular property.

Live examples checked during implementation included regional potato data for Northeast Brazil (January–December, source updated 2020), soybean (May–June), and maize in Peru (regional periods, source updated 2025). Maize for Northeast Brazil returned no calendar. These are source/integration checks, not field validation or evidence that these dates are optimal for every farmer.

The source sometimes marks all_year=yes alongside a shorter explicit sowing interval. The adapter preserves valid explicit dates and records that inconsistency in source notes instead of extending the interval to a year. Notes such as irrigation during the dry season remain visible. Regional and historical calendars do not account automatically for cultivar, soil, irrigation, current weather anomalies or farm-specific management. Their update dates are retained and shown.

## Reverse geocoding and privacy

Nominatim/OpenStreetMap is used only to support the agricultural calendar when country metadata are unavailable. Queries contain rounded coordinates and ask for coarse geography; raw address fields are discarded. Results are cached in server RAM for up to one hour, with a bounded 256-point cache. FAO metadata also use bounded one-hour caching. This is additional server-side retention and is distinct from the weather selection kept in app-session state.

The public Nominatim service requires attribution, an identifying User-Agent, cached results, moderate use, and at most one request per second for the application across all users. The adapter spaces calls by at least 1.05 seconds in a single process. Deploy this limiter with one worker and one instance; scaling requires a shared limiter or a different provider. NOMINATIM_REVERSE_URL permits an HTTPS provider change without a mobile release. Provider availability and policies can change; this public endpoint is not an unlimited production geocoding service. The interface discloses the additional lookup and links its terms/attribution.

Home also blocks device-origin calendar requests when the project API endpoint is not HTTPS. Local HTTP testing can use an explicitly selected public municipality; private device points require HTTPS. Where city country metadata are present, calendar requests omit coordinates entirely.

Rounded points can still be personal data. Providers and the project server can observe requests and connection metadata; this implementation does not establish complete LGPD compliance. Precise GPS metadata, EXIF details and account identifiers are not added to calendar requests.

## Session and remaining limitations

This prototype has no account-authentication flow. Log out therefore ends the local UI session, clears access to the in-memory chat session and selected location, and preserves saved profile records. It does not revoke an authenticated account or erase the existing agent checkpoint from server memory. The terms modal is a prototype description, not reviewed publication terms.

POST /api/recommendation reuses the existing rotation engine in strict-data mode. NASA POWER failures produce an explicit service error rather than synthetic climate defaults. This is an annual historical assessment for 2023, pending agronomic validation; the accepted planting month does not affect this model and soil suitability remains unassessed. The interface distinguishes HTTP and network failures from successful results. Rotation scenarios remain explicitly marked as examples. The trained best.pt checkpoint is absent from this workspace, so real inference and physical-device camera behavior remain pending.

## Sources

- FAO Crop Calendar: https://cropcalendar.apps.fao.org/
- Public API documentation: https://api-cropcalendar.apps.fao.org/
- API base and calendar records: https://api-cropcalendar.apps.fao.org/api/v1/countries/BR/cropCalendar?language=en
- International maize coverage lookup: https://api-cropcalendar.apps.fao.org/api/v1/countries/crops?crops=0338&language=en
- Nominatim reverse API: https://nominatim.org/release-docs/latest/api/Reverse/
- Public service usage policy: https://operations.osmfoundation.org/policies/nominatim/
- OpenStreetMap attribution and ODbL: https://www.openstreetmap.org/copyright

## Verification scope

HTTP contract, parsing, cache, geographic scoping, missing-data and error tests use synthetic fixtures; selected public FAO and reverse-geocoding responses were also checked live. Browser UI checks and mobile/static checks are recorded separately after completion. CNN and Groq are simulated in integration checks; no model training or repeated real Groq requests are part of this task.

## Completed verification

TypeScript and lint passed with zero errors. The 24 existing weather/device/current-weather service tests passed; 19 backend tests passed (13 weather and 6 calendar tests). Synthetic chat/CNN/Groq integration checks passed without real provider calls or model loading. Browser checks passed for global PT/EN, profile/back, soil/risk sheets, the rotation demonstration, camera/back without permission, settings, terms and local-session termination. Calendar checks included Brazil and Peru, explicit regional selection even when one unresolved option exists, omitted coordinates for known public-city country metadata, missing coverage, dynamic May–June and full-year clock geometry, and November–February wraparound. The end-month label was verified below the SVG rather than inside the circle. The final iOS JavaScript/Hermes bundle was generated successfully. The UI screenshots use clearly marked synthetic test responses; selected official FAO responses were checked separately. Physical-phone testing and real CNN/Groq inference remain outside these results.

Changes remain uncommitted on local main, based on 745b354; no commit or push was performed for this work.

## Functional audit corrections

The Home footer now reserves layout space instead of covering scrollable controls. Selected/expanded controls expose web accessibility state as well as native state; profile statistics wrap within small cards. Camera capture has a synchronous duplicate guard, cancellation on blur/back and visible error feedback. The chat displays structured CNN class/confidence as a visual hypothesis even when agent prose omits it. Invalid replacement photos preserve the previous valid conversation state; missing models and unconfigured agents return service errors. Local web origins have restricted CORS support; CORS is not authentication and the API remains intended for protected local testing. Reverse-geocoding provider configuration is resolved after environment loading and segregates cached results by provider. Correction evidence is recorded separately in /workspace/output/functional-fixes; original audit results remain historical. Real model inference, provider credentials and physical-device behavior require separate validation.
