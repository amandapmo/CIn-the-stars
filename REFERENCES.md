# Scientific References - CIn the Stars

**Responsible Team:** José Arthur and Mateus Costa (Data Science and Machine Learning)

**1. Tiemann et al. (2015)**
-   **Title:** Crop rotational diversity and soil processes
-   **Journal:** Ecology Letters | DOI: 10.1111/ele.12453
-   **Relevant Results:** Highlights that alternating root depth and including legumes improve soil structure and organic matter.
-   **Functionality:** Decision engine scoring algorithm (assigning +25 points for nitrogen-fixing crops after growing exhaustive grasses like corn, and +15 points for deep root systems).
-   **Limitations:** Structural soil recovery processes require long-term execution, but the MVP applies the principle for the immediate decision-making of the next harvest.

**2. NASA POWER Project**
-   **Institution:** NASA (Prediction Of Worldwide Energy Resources)
-   **URL:** https://power.larc.nasa.gov/
-   **Functionality:** Extraction of variables `PRECTOTCORR` (Corrected Precipitation) and `T2M_MIN` (Minimum Temperature) to calculate seasonal water anomalies and frost risk (threshold < 5°C).
-   **Limitations:** Macro spatial resolution, requiring validation of the local microclimate and field sensors by the farmer.

**3. FAOSTAT and FAO Database**
-   **Institution:** Food and Agriculture Organization of the United Nations (FAO)
-   **Functionality:** Provision of botanical parameters and absolute thresholds (ideal temperature and water demand) to build the "Global Agronomic Matrix" of 15 crops used in the biophysical filter.