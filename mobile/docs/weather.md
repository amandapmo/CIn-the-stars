# Weather, worldwide locations and optional device position

Provider: [Open-Meteo](https://open-meteo.com/en/docs). Public hosted access requires no key for non-commercial use within its [terms](https://open-meteo.com/en/terms). The interface credits Open-Meteo and GeoNames and links to CC BY 4.0. No new runtime dependency is required; device location reuses the existing Expo Location SDK and useAppLocation hook.

## User-controlled inputs

- Initial Home rendering makes no location, weather or geocoding request.
- Manual worldwide search submits a city name only after the user presses Search. Region/country labels distinguish namesakes; up to 20 results and country/region qualifiers are supported. Coverage is the GeoNames gazetteer, not every official municipality.
- Optional device position starts only after pressing “Usar minha localização aproximada”. The hook checks/reuses foreground permission or requests it when appropriate. It requests the SDK's lowest accuracy, without background permission, watch subscriptions or a settings dialog to improve precision.
- Denial, unavailable services, stale results and timeouts leave manual selection available. Choosing a municipality ignores any late device result. This does not cancel the native one-shot acquisition itself.
- Recife remains an explicitly labelled demonstration option.

## Metadata minimization

Before assignment to app-owned state, the device result is validated and reduced to rounded latitude/longitude. The weather hook also normalizes all locations through an explicit field allowlist.

| Field                                                                                  | Treatment                                                                                                                               |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Latitude and longitude                                                                 | Rounded locally to two decimal places; used only as the selected approximate point                                                      |
| Device capture timestamp                                                               | Checked locally for freshness (five-minute maximum age and one-minute future-clock tolerance); excluded from state and outgoing queries |
| Altitude, altitude accuracy, reported accuracy, heading, speed and mock-provider flags | Not copied into app-owned location state or forecast requests                                                                           |
| Account/device identifiers                                                             | Not added to the weather flow                                                                                                           |

Only rounded coordinates and required forecast options are sent to Open-Meteo. Session state is not persisted. Rounding reduces precision; it is not anonymization or a guarantee of physical positioning accuracy. Accuracy.Lowest is a best-effort acquisition setting.

SDK/OS boundaries matter: the inspected Expo Location 58 web implementation caches a raw last-known position temporarily, and operating systems manage their own location data. This integration does not promise erasure of all raw metadata from SDK/OS memory. The app rejects stale returned positions instead of claiming they are fresh.

The external provider sees request coordinates/search text and connection metadata such as IP address. Its policy consulted on November 15, 2026 describes logs that may contain coordinates and are deleted after 90 days. This is distinct from the app's session-only state. No additional API key, location logging, analytics or account storage is introduced by this feature. OS permission and a user action do not by themselves establish a lawful basis or complete LGPD compliance.

## Forecast and agricultural integration

The selected point requests 15 daily model-based forecasts in metric units with automatic local timezone selection. The UI shows dated conditions, maximum/minimum temperatures, precipitation probability, retrieval time and attribution. Missing values remain unavailable, and errors offer retry rather than simulated weather.

Weather refresh reuses the selected approximate point. A new device position requires another explicit request; the app does not follow movement. The existing agricultural-analysis action also receives only the selected approximate coordinates when explicitly requested. Crop scoring, backend services and navigation are unchanged.

The agricultural API client accepts EXPO_PUBLIC_API_BASE_URL and otherwise retains its existing development endpoint. Home blocks submission of a device-origin point to agricultural analysis when that endpoint is not HTTPS. Configure an HTTPS backend to enable this path; the forecast remains available independently. Server-side retention and the broader deployment still require separate review; this integration does not certify the whole application's security or legal compliance.

## Build and verification

Native permission wording is configured in app.json through the Expo Location plugin, with background and foreground-service flags disabled. Permission text changes require a new native binary; Expo Go uses its host permissions.

Run npm run typecheck, npm run lint and npm run test:weather. Tests cover response contracts, allowed fields, coordinate reduction, permission decisions, stale positions, denied/unavailable acquisition, timeout, ignored late results, missing values, dates, units and external request minimization. Browser device-position tests use synthetic coordinates, not a physical phone or private farm.

## Report evidence

Public worldwide search examples and forecast responses are saved in examples/worldwide-weather-demo.json. They are integration demonstrations, not observed farm weather or agricultural validation. References and the device-location data-flow description are recorded in the project REFERENCES.md and METHODOLOGY.md.
