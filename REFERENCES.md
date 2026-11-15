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

## Weather and Geographic Location References

GeoNames. (n.d.). *About GeoNames*. Retrieved November 15, 2026, from https://www.geonames.org/about.html

Open-Meteo. (n.d.-a). *Geocoding API*. Retrieved November 15, 2026, from https://open-meteo.com/en/docs/geocoding-api

Open-Meteo. (n.d.-b). *Licence*. Retrieved November 15, 2026, from https://open-meteo.com/en/licence

Open-Meteo. (n.d.-c). *Terms & privacy*. Retrieved November 15, 2026, from https://open-meteo.com/en/terms

Open-Meteo. (n.d.-d). *Weather forecast API*. Retrieved November 15, 2026, from https://open-meteo.com/en/docs

Zippenfenig, P. (2023). *Open-Meteo.com Weather API* [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.7970649

## Naming and Visual Identity References

Navarro, E. de A. (n.d.). *Curso breve de tupi antigo em dez lições: Com base nos nomes de origem tupi da geografia e do português do Brasil* [Course material]. https://www.filologia.org.br/xvii_cnlf/trab_completos/Curso%20breve%20de%20tupi%20antigo.pdf

Universidade de São Paulo. (n.d.). *Sobre*. Tupi Antigo e Língua Geral (Nheengatu). Retrieved November 15, 2026, from https://tupi.fflch.usp.br/
