# Weather forecast integration

Provider: [Open-Meteo](https://open-meteo.com/en/docs). The public API requires no key and is offered for non-commercial use subject to its [terms](https://open-meteo.com/en/terms). The interface credits Open-Meteo and links to CC BY 4.0. No runtime dependency was added.

## Data flow

1. The initial Home makes no weather/geocoding request.
2. The user opens the municipality picker and sees the external-service notice.
3. An explicit search submits the typed city/municipality and display options to the worldwide geocoding endpoint. Typing alone makes no request. Up to 20 results display the place, region and country, when available. Users can append an exact country/region qualifier, such as `Paris, França`.
4. Selecting a result requests 15 daily forecasts using municipal coordinates rounded locally to two decimal places. The weather endpoint does not receive the display name, account identifier, or a property address from this code.
5. The interface shows dated weather conditions, maximum/minimum temperatures, precipitation probability, query time, and provider attribution. Missing values remain unavailable; failures show a retry action rather than simulated weather.

Recife is available only through an explicitly labelled demonstration action. Each app session can choose another municipality; the header follows that choice. The choice is not stored in an account or persisted across app restarts.

## Privacy boundaries

- No GPS permission, device geolocation, location SDK, analytics, or location logging was added.
- The external provider receives the search text and approximate coordinates at the respective endpoints, plus connection metadata such as IP address. Its own retention and processing are governed by its privacy policy; this client does not hide the IP.
- The provider's free-API privacy policy consulted on November 15, 2026 states that service logs may contain coordinates and are deleted after 90 days. This is distinct from the app's non-persistence. The picker links to the provider policy before searching.
- Search instructions ask for municipality names rather than personal information or addresses. No requests are made on each keystroke.
- Municipality selection and forecasts remain in component memory. This integration adds no local database, persistent cache, or account-based location storage.
- Rounding reduces coordinate precision; it is not a guarantee of anonymization. Real property tracking, persistence, or account linkage would require a separate privacy design and documented legal basis before implementation. These measures alone do not establish LGPD compliance.

## Scope

Based on main commit `578d169`, including Amanda's FastAPI/Google Weather work and the team's current Home/navigation. The existing backend, Google service and team analytical modules are preserved. Open-Meteo forecast/geocoding requests are made directly from this mobile feature using HTTPS, with the external-service notice described above.

The forecast strip replaces the illustrative planting timeline in the current Home. The municipality selection also supplies approximate coordinates when the user explicitly requests the existing agricultural analysis. The Home no longer invokes the automatic GPS hook or prints the request payload. The remote placeholder avatar was replaced by a local icon to remove an unnecessary external image request.

The forecast is short-term model-based weather information, not a validated planting recommendation, crop-growth model, soil suitability score, or replacement for the NASA historical-data pipeline. The existing recommendation API endpoint and its deployment configuration remain outside this integration's scope; they must be configured appropriately for the intended environment.

Validation commands: `npm run typecheck`, `npm run lint`, and `npm run test:weather`. Tests cover response contracts, missing values, units, calendar dates, input validation, cancellation, request minimization, and error handling.

## Worldwide place search and report evidence

The geocoding endpoint is based on GeoNames and supports worldwide place search, not an exhaustive official register of every municipality. It has no Brazil-only filter. Country names use the requested Portuguese localization when available, falling back to country codes; region/country labels distinguish namesakes. Both GeoNames and Open-Meteo are credited in the interface.

Public city-centre examples for Recife, Paris, Tokyo, Nairobi and Bogotá, plus 15-day forecast responses for Recife and Paris, are saved in `examples/worldwide-weather-demo.json` with query parameters and retrieval timestamps. These are live integration demonstrations, not measured weather observations or agricultural validation. References are recorded in [the project bibliography](../../REFERENCES.md#weather-and-geographic-location-references).
