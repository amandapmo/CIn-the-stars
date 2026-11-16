import json
import time
from math import isfinite

import pandas as pd
import requests

# Agronomic Matrix Extended
crop_data = [
    {"crop": "Cowpea", "water": "Medium", "nitrogen": True,
     "cold_tolerant": False},
    {"crop": "Cassava", "water": "Low", "nitrogen": False,
     "cold_tolerant": False},
    {"crop": "Corn", "water": "High", "nitrogen": False,
     "cold_tolerant": False},
    {"crop": "Forage Cactus", "water": "Low", "nitrogen": False,
     "cold_tolerant": False},
    {"crop": "Soybean", "water": "Medium", "nitrogen": True,
     "cold_tolerant": False},
    {"crop": "Wheat", "water": "Medium", "nitrogen": False,
     "cold_tolerant": True},
    {"crop": "Quinoa", "water": "Low", "nitrogen": False,
     "cold_tolerant": True},
    {"crop": "Potato", "water": "Medium", "nitrogen": False,
     "cold_tolerant": True}
]
df_crops = pd.DataFrame(crop_data)


def generate_mvp_recommendation(lat, lon, previous_crop, strict_data=False):
    
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "T2M_MIN,PRECTOTCORR",
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": "20230101", 
        "end": "20231231", 
        "format": "JSON"
    }
    
    try:
        time.sleep(0.5) 
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status() 
        data = response.json()
        
        rain_data = data['properties']['parameter']['PRECTOTCORR']
        min_temp_data = data['properties']['parameter']['T2M_MIN']

        if strict_data and rain_data.keys() != min_temp_data.keys():
            raise ValueError("Historical climate dates do not match.")
        
        df = pd.DataFrame({
            'rain': list(rain_data.values()), 
            'min_temp': list(min_temp_data.values())
        })

        if strict_data:
            df = df.apply(pd.to_numeric, errors='raise')
            if (
                df.empty
                or not all(isfinite(value) for value in df.to_numpy().flat)
                or (df['rain'] < 0).any()
                or (df['min_temp'] <= -100).any()
            ):
                raise ValueError("Historical climate data is incomplete.")
        
        df = df[df['min_temp'] > -100]
        historical_min_temp = df['min_temp'].min()
        avg_daily_rain = df['rain'].mean()
        
    except Exception:
        if strict_data:
            raise RuntimeError(
                "Historical climate data is unavailable or invalid."
            ) from None
        historical_min_temp = 20.0
        avg_daily_rain = 3.5

    frost_risk = "High" if historical_min_temp < 5 else "None"
    rain_forecast = (
        "Low" if avg_daily_rain < 2
        else ("Medium" if avg_daily_rain < 5 else "High")
    )
    
    df_rank = df_crops.copy()
    df_rank['score'] = 50 
    
    for idx, row in df_rank.iterrows():
        
        # Thermal Risk Filter preventing tropical crops in cold areas
        if frost_risk == "High" and not row['cold_tolerant']:
            df_rank.at[idx, 'score'] = -999
            continue 
        
        # Water Resilience Filter
        if rain_forecast == "Low" and row['water'] == "Low":
            df_rank.at[idx, 'score'] += 30
        elif rain_forecast == "Low" and row['water'] == "High":
            df_rank.at[idx, 'score'] -= 40
        elif rain_forecast == "High" and row['crop'] == "Forage Cactus":
            df_rank.at[idx, 'score'] -= 50
            
        # Crop Rotation and Nitrogen Filter
        if previous_crop == "Corn" and row['nitrogen']:
            df_rank.at[idx, 'score'] += 25
            
    # Remove unviable crops and sort
    df_rank = (
        df_rank[df_rank['score'] > 0]
        .sort_values(by='score', ascending=False).reset_index(drop=True)
    )
    
    top_recommendations = []
    
    for rank, row in df_rank.iterrows():
        if rank >= 5:
            break
        top_recommendations.append({
            "crop": row['crop'],
            "rank": rank + 1
        })
        
    if not top_recommendations:
        top_recommendations.append({
            "crop": "Climatic Fallow",
            "rank": 1,
            "reason": "Extreme weather detected. Planting is unviable."
        })
    
    payload_frontend = {
        "location": {
            "latitude": lat,
            "longitude": lon
        },
        "soil_analysis": {
            "soil_type": None,
            "status": "unidentified",
            "confidence": None,
            "requires_followup": True
        },
        "climate_assessment": {
            "status": "pending_validation",
            "planting_window": "Assumed annual average",
            "irrigation_assumed": False
        },
        "ml_top5": top_recommendations,
        "recommendation_status": (
            "success" if top_recommendations[0]["crop"] != "Climatic Fallow"
            else "warning"
        )
    }
        
    return json.dumps(payload_frontend, indent=2, ensure_ascii=False)
