# Methodology - CIn the Stars

**Responsible Team:** José Arthur and Mateus Costa (Data Science and Machine Learning)

## 1. Investigated Problem and Variables
The decision engine solves the difficulty of cross-referencing real climate data with biological needs. We used data from the **NASA POWER API** (aggregated into 3-month windows for `chuva_safra_3m_mm` and `temp_min_safra_3m_c`) crossed with an **Agronomic Matrix** built via FAO guidelines.
    
## 2. Cleaning and Processing (Pandas)
Satellite reading errors (-999) were removed and linearly interpolated using Pandas. The daily granularity (`DOY`) was converted into monthly averages and subsequently aggregated into a "3-Month Rolling Seasonal Window", accurately reflecting the actual cycle of a crop season.

## 3. Methods and Algorithms Applied
We adopted a deterministic system based on filters and weights (Scoring) to ensure explainability, avoiding the "black box" effect of generic neural networks:
1.  **Hard Filters (Biophysical Filters):** Boolean masks exclude crops whenever the NASA precipitation or temperature forecast falls outside the plant's tolerance thresholds.
2.  **Rotation Scoring:** The algorithm evaluates the previous crop and applies mathematical bonuses for new season plants that break the pest cycle (different botanical family) and recover the soil (e.g., nitrogen-fixing legumes).

## 4. Limitations
The classification of water and thermal risk is based on historical averages and spatially aggregated satellite data. The prototype serves as macro decision support and does not replace laboratory soil analysis and microclimate monitoring of the local property.

## 5. Mobile Weather and Worldwide Location Search

This integration adds an operational weather display alongside the existing agricultural modules. It does not change or validate their crop-scoring rules. Locations are searched through the Open-Meteo Geocoding API, whose place data derive from GeoNames. Results display the place name, available first-level administrative area, and country. Search supports country/region qualifiers and returns up to 20 matches without a Brazil-only filter. Worldwide gazetteer coverage is not an exhaustive register of every official municipality.

The user initiates a search and explicitly selects a result. The app rounds municipal coordinates locally to two decimal places before requesting 15 daily forecasts in metric units with automatic local-timezone selection. It validates response structure, units, dates and plausible field bounds, preserves unavailable values as missing, and displays provider errors rather than simulated forecasts. This is response-contract validation, not a measurement of forecast accuracy.

| Stage | Input or source | Transformation | Output and boundary |
|---|---|---|---|
| Location search | User-entered city name; Open-Meteo/GeoNames | Explicit search; display region/country for disambiguation | Candidate public places; no GPS or property-address collection is requested |
| Optional device position | Existing Expo Location hook, foreground permission | Explicit user request, local freshness check and metadata allowlist | Approximate point only; SDK/OS transient caches and provider-side retention remain separate |
| Coordinate preparation | Selected public place | Round latitude/longitude to two decimal places locally | Approximate municipal point; not a farm boundary or anonymization guarantee |
| Forecast request | Open-Meteo Forecast API | Request15daily records, metric units and local timezone | Model-based forecast; not observed farm conditions |
| Mobile presentation | Validated forecast fields and WMO condition codes | Format dates, conditions, temperatures and precipitation probability | Forecast strip with attribution and retrieval time; no agronomic ranking is computed here |

The choice remains in app-session memory. External requests disclose the query or approximate coordinates and connection metadata, including IP, to the provider. Its published privacy policy describes service logs that can contain coordinates and are deleted after 90 days; app-session-only storage does not imply provider-side deletion on exit. These measures do not constitute a declaration of LGPD compliance.

Demonstration examples and retrieval timestamps are recorded in `mobile/docs/examples/worldwide-weather-demo.json`. They use public city-centre information, not farmer accounts or private property locations. They demonstrate integration and selected geographic coverage; they do not prove completeness, local agronomic suitability or field benefits. Technical implementation and verification details are documented in `mobile/docs/weather.md`.

### Optional Foreground Device Position

The existing `useAppLocation` hook is reused through an explicit user action, rather than mount-time acquisition. It checks foreground permission and requests the SDK's lowest positioning accuracy. No background tracking or position subscription is added. The app validates the capture timestamp locally for freshness, then excludes it and other SDK metadata from app-owned state and outgoing weather requests. Only latitude/longitude rounded to two decimal places are retained as the selected point. Weather locations are allowlisted before loading, error and success state assignment, preventing arbitrary extra properties from being retained.

The five-minute age limit, one-minute future-clock tolerance and twenty-second acquisition wait are engineering safeguards, not legal thresholds or agronomic validation criteria. Denied, stale or unavailable positions preserve manual municipality selection. Cancellation ignores late results; the SDK does not expose cancellation of the native one-shot acquisition. SDK/OS transient caches are outside the state-retention guarantee, and coordinate rounding is not anonymization. OS permission does not establish complete LGPD compliance. No raw device-position samples are saved in the report dataset; device-position tests use synthetic inputs.
