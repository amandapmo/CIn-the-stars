import requests
import pandas as pd
from rotation_engine import generate_mvp_recommendation

def test_global_coordinates(lat, lon, previous_crop="Corn"):
    print(f"📡 Querying NASA POWER API for Lat: {lat}, Lon: {lon}...")
    
    # 1. Hit NASA API (Fetching last 3 years of rain and min temp)
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "T2M_MIN,PRECTOTCORR",
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": "20210101",
        "end": "20231231",
        "format": "JSON"
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    # 2. Extract data dictionaries from NASA JSON
    rain_data = data['properties']['parameter']['PRECTOTCORR']
    min_temp_data = data['properties']['parameter']['T2M_MIN']
    
    # 3. Convert to Pandas DataFrame
    df = pd.DataFrame({
        'rain': list(rain_data.values()), 
        'min_temp': list(min_temp_data.values())
    })
    
    # 4. Clean satellite errors (-999 is NASA's error code for null data)
    df = df[df['min_temp'] > -100]
    
    # 5. Create the exact format expected by rotation_engine.py
    # Multiply daily rain average by 30 to simulate monthly average
    df_mock = pd.DataFrame({
        'temp_min_extrema_c': [df['min_temp'].min()], 
        'chuva_mensal_media_mm': [df['rain'].mean() * 30] 
    })
    
    # Save temporary CSV for the engine to consume
    csv_path = "data_ml/data/api_temp_climate.csv"
    df_mock.to_csv(csv_path, index=False)
    
    # 6. Run the engine with global coordinates
    result_json = generate_mvp_recommendation(csv_path, previous_crop)
    return result_json

if __name__ == "__main__":
    print("\n🌍 TEST 1: Sahara Desert (Egypt) - Absolute Drought")
    print(test_global_coordinates(lat=26.8206, lon=30.8025, previous_crop="Corn"))

    print("\n🌍 TEST 2: Sinop/MT (Brazil) - Hot and Rainy Climate")
    print(test_global_coordinates(lat=-11.8643, lon=-55.5059, previous_crop="Cassava"))

    print("\n🌍 TEST 3: Norilsk (Russia) - Extreme Cold/Snow")
    print(test_global_coordinates(lat=69.3558, lon=88.1893, previous_crop="Corn"))

    print("\n🌍 TEST 4: Jakarta (Indonesia) - Tropical Rainforest (Hot & Very Wet)")
    print(test_global_coordinates(lat=-6.2088, lon=106.8456, previous_crop="Corn"))

    print("\n🌍 TEST 5: Alice Springs (Australia) - Arid Outback (Hot & Dry)")
    print(test_global_coordinates(lat=-23.6980, lon=133.8807, previous_crop="Cowpea"))

    print("\n🌍 TEST 6: La Paz (Bolivia) - High Altitude Andes (Cold & Frost Risk)")
    print(test_global_coordinates(lat=-16.4897, lon=-68.1193, previous_crop="Cassava"))

    print("\n🌍 TEST 7: Des Moines, Iowa (USA) - US Corn Belt (Temperate)")
    print(test_global_coordinates(lat=41.5868, lon=-93.6250, previous_crop="Forage Cactus"))

    print("\n🌍 TEST 8: Paris (France) - Western Europe (Mild & Moderate Rain)")
    print(test_global_coordinates(lat=48.8566, lon=2.3522, previous_crop="Corn"))