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