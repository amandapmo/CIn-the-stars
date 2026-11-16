# CIn the Stars

**NASA Space Apps Challenge 2026**

**Challenge: Field Shift: Adapting Farms with NASA Data**

CIn the Stars is an agricultural decision-support prototype exploring how NASA Earth-observation climate data can inform crop rotation and planting decisions. It brings together a mobile interface, a NASA POWER-based climate-analysis and crop-ranking prototype, a current-weather API, an AI-agent experiment, and a computer-vision training pipeline.

> **Prototype status:** The repository contains working pieces at different levels of integration. The FastAPI backend currently serves current weather only. The mobile app's rotation-result page uses clearly labeled demonstration scenarios; its recommendation and camera clients target endpoints that are not implemented in this backend. The AI-agent graph contains demonstration/stub nodes, and the vision training code is separate from the mobile camera flow. See [Integration status and limitations](#integration-status-and-limitations).

## Project overview

Farmers face increasingly variable rainfall and temperature, but selecting a planting window or crop rotation requires comparing local climate conditions with crop tolerances and the effects of the previous crop. CIn the Stars explores a practical way to make those factors easier to inspect.

The project combines:

- **NASA POWER climate data** to examine precipitation and temperature patterns at specified coordinates.
- **Explainable crop-ranking logic** that applies simple climate filters and crop-rotation adjustments rather than presenting a black-box recommendation.
- **A cross-platform mobile prototype** for location-aware exploration, crop selection, weather display, and agricultural profile and camera screens.
- **AI-agent and computer-vision experiments** intended to turn climate and plant-health information into farmer-oriented guidance.

The aim is decision support, not a guarantee of yield or a replacement for local agronomic advice, soil testing, or field observations.

## System architecture

```text
Expo / React Native mobile app
  ├─ Current-weather client ──> FastAPI ──> Google Weather API
  ├─ Crop recommendation client ──> /api/recommendation (not implemented here)
  └─ Camera client ──> /predict (not implemented here)

data_ml climate and rotation prototype
  └─ NASA POWER daily point API ──> deterministic crop-ranking result
       ▲
       └─ ai_agents LangGraph experiment calls the rotation engine

vision/
  └─ PlantVillage data preparation, YOLOv8 classification training/evaluation
       (separate from the mobile camera and backend endpoints)
```

### Repository structure

| Path | Purpose |
| --- | --- |
| [`mobile/`](./mobile/) | Expo / React Native TypeScript application, screens, navigation, UI components, and API clients. |
| [`backend/`](./backend/) | FastAPI application. Implements `GET /api/weather/current` and normalizes responses from Google Weather API. |
| [`ai_agents/`](./ai_agents/) | LangGraph workflow experiment that calls the crop-rotation engine and formats a farmer-facing response with a Groq-hosted language model. Several graph nodes are placeholders or demo data. |
| [`data_ml/`](./data_ml/) | NASA POWER data, climate exploration notebook, data-preparation scripts, and a deterministic crop rotation/ranking engine. |
| [`vision/`](./vision/) | PlantVillage dataset auditing/preparation tools and YOLOv8 image-classification training, prediction, and evaluation scripts. |
| [`METHODOLOGY.md`](./METHODOLOGY.md) | Method and assumptions documented for the climate and crop-rotation work. |
| [`REFERENCES.md`](./REFERENCES.md) | Scientific and institutional references. |

### Component responsibilities and data flow

1. **Mobile app:** `AppNavigator` connects the Home, chat placeholder, rotation-result, camera, and profile screens. The Home screen collects a previous crop and device coordinates and can request a recommendation. The rotation-result screen switches between two mock scenarios and separately requests current weather for their coordinates.
2. **Weather backend:** `backend/main.py` validates latitude and longitude and exposes `GET /api/weather/current?lat=...&lon=...`. `backend/services/google_weather.py` makes the upstream Google Weather request and normalizes the current-condition fields for the app.
3. **Climate and rotation analysis:** `data_ml/src/rotation_engine.py` queries the NASA POWER daily point endpoint for `T2M_MIN` and `PRECTOTCORR`, then applies hard frost/water filters and a small set of crop-rotation score adjustments. The separate preparation script and notebook process historical files into monthly and three-month seasonal summaries.
4. **AI-agent experiment:** `ai_agents/router_graph.py` calls `generate_mvp_recommendation` and uses LangGraph to pass context to an explanation step. Its research node currently returns the state unchanged; market information and image diagnosis are demonstration data, not live integrations.
5. **Vision experiments:** `vision/` prepares and audits PlantVillage image data and contains YOLOv8 classification training and evaluation scripts. These are not served by the FastAPI app, and trained weights and source images are not included in the repository.

## NASA and scientific data sources

### NASA POWER

The project references NASA's [Prediction Of Worldwide Energy Resources (POWER)](https://power.larc.nasa.gov/) daily point API:

`https://power.larc.nasa.gov/api/temporal/daily/point`

- The current `data_ml/src/rotation_engine.py` requests **`T2M_MIN`** (minimum air temperature at 2 m) and **`PRECTOTCORR`** (corrected precipitation) for coordinates supplied to the engine. Its request is fixed to **2023-01-01 through 2023-12-31**.
- The tracked daily POWER CSV files cover **2021-01-01 through 2025-12-31** for sample points near **Petrolina, Brazil; Niamey, Niger; and Cherkasy, Ukraine**. The data-preparation script reads `T2M`, `T2M_MAX`, `T2M_MIN`, and `PRECTOTCORR`; it replaces NASA's `-999` missing-value marker, interpolates short gaps, and derives monthly and three-month seasonal summaries.
- The climate-exploration notebook also requests **`RH2M`** (relative humidity at 2 m) and **`GWETROOT`** (root-zone soil wetness), in addition to the temperature and precipitation parameters above. It derives monthly means/extrema, rainfall variability, and cyclic three-month planting windows.
- Derived climate fields in the prepared sample CSVs include `temp_media_c`, `temp_min_extrema_c`, `temp_max_extrema_c`, `chuva_mensal_media_mm`, `chuva_safra_3m_mm`, `temp_media_safra_3m_c`, `temp_min_safra_3m_c`, and `temp_max_safra_3m_c`.

The notebook contains an exploratory 15-crop agronomic matrix with temperature, rainfall, soil-moisture, nitrogen-fixation, and crop-cycle attributes. The current runtime engine uses a **smaller eight-crop matrix** with water-demand class, nitrogen-fixing flag, and cold-tolerance flag. The 15-crop notebook matrix should therefore be treated as exploratory work, not as the matrix currently used by `rotation_engine.py`.

### Weather and other references

- **Google Weather API:** The backend calls `https://weather.googleapis.com/v1/currentConditions:lookup` for current conditions. It handles temperature and feels-like temperature in Celsius, relative humidity, condition description, precipitation probability, precipitation quantity in millimeters, wind speed in km/h, observation time, and time-zone ID. This is a weather integration, distinct from the NASA POWER historical/climate analysis.
- **FAO / FAOSTAT:** The methodology and notebook refer to FAO agronomic guidance and FAO/FAOSTAT material as sources for crop parameters. The repository does not include a live FAO API client.
- **Crop-rotation research:** The references document Tiemann et al. (2015), *Crop rotational diversity and soil processes*, as support for rotation-diversity and soil-process considerations.

For the full assumptions and citations, see [METHODOLOGY.md](./METHODOLOGY.md) and [REFERENCES.md](./REFERENCES.md).

## Tech stack

| Area | Technologies found in the repository |
| --- | --- |
| Mobile | React Native, Expo, TypeScript, React Navigation, Expo Camera, Expo Location, Expo Image Picker, Expo Linear Gradient, Expo Status Bar, Expo Vector Icons, React Native SVG, Safe Area Context, React Native Screens, Async Storage, Axios, React DOM, React Native Web, and `fetch`. |
| Backend | Python, FastAPI, Pydantic, HTTPX, `python-dotenv`, Uvicorn, and pytest. The declared backend dependencies are in [`backend/requirements.txt`](./backend/requirements.txt). |
| Climate / data analysis | Python, Pandas, NumPy, Requests, and Matplotlib (including notebook exploration). No `data_ml/requirements.txt` is currently provided. |
| AI-agent experiment | LangGraph, LangChain Core, LangChain Groq, and `python-dotenv`. No `ai_agents/requirements.txt` or `.env.example` is currently provided. |
| Computer vision | Ultralytics YOLOv8 classification, PyTorch, Torchvision, OpenCV, Pillow, NumPy, and Matplotlib. The vision requirements file pins a Linux x86_64 / Python 3.14 / CUDA 12.8 environment; see its header before attempting installation. Evaluation code also imports scikit-learn, which is not listed in that requirements file. |

The crop-ranking engine is deterministic rule-based scoring; it is not a trained climate or yield-prediction model. The vision scripts use YOLO **classification** (`yolov8n-cls.pt`), not an object-detection pipeline.

## Setup and installation

### 1. Run the FastAPI backend

Use Python 3.10 or newer. From the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set `GOOGLE_WEATHER_API_KEY` to a valid, appropriately restricted Google Weather API key. Do not commit the key or put it in the mobile app.

Start the API:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The implemented route is:

```text
GET http://localhost:8000/api/weather/current?lat=-9.3828&lon=-40.5028
```

API documentation is available at `http://localhost:8000/docs`. To run the backend tests, from the `backend/` directory use:

```powershell
pytest
```

### 2. Run the Expo mobile app

In a second terminal, from the repository root:

```powershell
cd mobile
Copy-Item .env.example .env
```

Edit `mobile/.env` and set `EXPO_PUBLIC_API_BASE_URL` to the backend URL reachable from the device. For a physical phone on the same Wi-Fi network, replace the example address with the development computer's LAN IP, for example:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:8000
```

Then install dependencies and start Expo:

```powershell
npm install
npx expo start
```

Open the app with Expo Go or a configured simulator. `localhost` on a physical phone refers to the phone itself, not the development computer. Keep the backend running and ensure the device and computer can reach one another on the network.

### Optional analysis environments

- `data_ml/` has no dedicated dependency manifest. Its scripts import Pandas, NumPy, and Requests; the notebook additionally uses Matplotlib. Install these in a separate Python environment if you want to run the analysis scripts.
- The vision requirements are platform-specific and include CUDA 12.8 PyTorch wheels for Linux x86_64. They are not a general Windows or CPU-only installation recipe. Vision training also expects dataset directories and model checkpoints that are not included here.
- `ai_agents/` has no dependency lockfile, requirements file, or checked-in environment template. The graph expects the LangChain/Groq packages and provider credentials to be configured separately.

## Team contributions

Contributions below reflect the tracked code and Git history, merged feature work, and team-reported design and prototyping contributions.

| Team member | Contributions |
| --- | --- |
| **José Arthur** (`Jose Arthur` / `José Arthur`) | Built the mobile Home-screen interface, gradient/SVG presentation, and navigation integration; implemented the crop-rotation engine matrix and cold-tolerance logic. |
| **Mateus Costa** (`Mateus Costa` / `Costa2208`) | Implemented the FastAPI backend structure and Google Weather API integration, including request normalization and tests; contributed to integration of the mobile and service modules. |
| **Amanda Pereira Muniz de Oliveira** (`amandapmo`) | Led repository coordination and pull-request integration across the AI-agent, rotation-engine, and camera/vision work; contributed to the mobile profile and navigation experience and project documentation. |
| **Pedro Amaral** (`Pedro Amaral`) | Authored Home-screen UI work and weather/location features, including location handling, weather service/UI changes, and related tests and documentation, as evidenced by his commit history. |
| **Jean Pietro Lacerda** (`Jean Pietro` / `Jean Lacerda`) | Developed the computer-vision and plant-analysis work: PlantVillage preparation/auditing, YOLOv8 classification training/evaluation scripts, and visual-symptom context for the AI-agent experiment. |
| **Vyvian** | Prototyped the project end-to-end and led its design, helping shape the overall visual direction and user experience. Her prototyping and design work made a significant contribution to the team and the project. |

## Integration status and limitations

- The backend currently implements **only** `GET /api/weather/current`. There is no `/api/recommendation` or `/predict` route in `backend/main.py`.
- The mobile Home screen sends a recommendation request to `/api/recommendation`, but that request cannot be fulfilled by the included backend. The rotation-result page uses two hard-coded demonstration scenarios; its text explicitly labels them as examples rather than live model output.
- The mobile camera screen posts an image to a hard-coded `/predict` address. No matching prediction API is implemented in this repository, and the vision scripts are not connected to FastAPI.
- The LangGraph experiment's research node is a pass-through, its market output is hard-coded, and its leaf diagnosis is simulated. The graph's use of a language model does not make these inputs live or validated.
- The runtime climate engine uses a single historical year for its live NASA POWER request and simple thresholds. Spatially aggregated climate data and historic values cannot represent every field's soil or microclimate.
- No local soil analysis, yield estimate, profit forecast, or independently validated farm-level prescription is provided. Confirm decisions with local agronomic expertise and field measurements.

## Methodology and references

- [Methodology](./METHODOLOGY.md)
- [Scientific references](./REFERENCES.md)
