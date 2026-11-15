import pandas as pd
import json

# 1. Agronomic Matrix
crop_data = [
    {"crop": "Cowpea", "water_requirement": "Medium", "fixes_nitrogen": True, "root_depth": "Shallow", "cycle_days": 75},
    {"crop": "Cassava", "water_requirement": "Low", "fixes_nitrogen": False, "root_depth": "Deep", "cycle_days": 240},
    {"crop": "Corn", "water_requirement": "High", "fixes_nitrogen": False, "root_depth": "Shallow", "cycle_days": 120},
    {"crop": "Forage Cactus", "water_requirement": "Low", "fixes_nitrogen": False, "root_depth": "Shallow", "cycle_days": 365}
]
df_crops = pd.DataFrame(crop_data)

# 2. Decision Engine & Climate Reading
def generate_mvp_recommendation(file_path, previous_crop):
    df_climate = pd.read_csv(file_path)
    
    historical_min_temp = df_climate['temp_min_extrema_c'].mean()
    avg_daily_rain = (df_climate['chuva_mensal_media_mm'].mean()) / 30 
    
    frost_risk = "None" if historical_min_temp > 5 else "High"
    rain_forecast = "Low" if avg_daily_rain < 2 else ("Medium" if avg_daily_rain < 5 else "High")
    
    df_rank = df_crops.copy()
    df_rank['score'] = 50 
    
    # Prepara listas vazias para benefícios e limitações
    df_rank['benefits'] = [[] for _ in range(len(df_rank))]
    df_rank['limitations'] = [[] for _ in range(len(df_rank))]
    
    for idx, row in df_rank.iterrows():
        benefits = []
        limitations = []
        
        # Filter 0: Thermal Risk
        if frost_risk == "High":
            df_rank.at[idx, 'score'] = -999
            limitations.append("Unviable: Crop dies with extreme cold/frost.")
            df_rank.at[idx, 'limitations'] = limitations
            continue 
        
        # Filter 1: Water Resilience
        if rain_forecast == "Low" and row['water_requirement'] == "Low":
            df_rank.at[idx, 'score'] += 30
            benefits.append("Tolerates low humidity predicted by NASA data.")
        elif rain_forecast == "Low" and row['water_requirement'] == "High":
            df_rank.at[idx, 'score'] -= 40
            limitations.append("High risk of crop failure due to water deficit.")
            
        # Filter 2: Crop and Soil Rotation
        if previous_crop == "Corn":
            if row['fixes_nitrogen']:
                df_rank.at[idx, 'score'] += 25
                benefits.append("Fixes nitrogen (recovers soil depleted by Corn).")
            if row['root_depth'] == "Deep":
                df_rank.at[idx, 'score'] += 15
                benefits.append("Deep root system accesses nutrients untouched by Corn.")
                
        if not benefits and not limitations:
            benefits.append("Suitable for regular planting based on current conditions.")
            
        df_rank.at[idx, 'benefits'] = benefits
        df_rank.at[idx, 'limitations'] = limitations
        
    df_rank = df_rank.sort_values(by='score', ascending=False).reset_index(drop=True)
    best_option = df_rank.iloc[0]
    
    # Constrói o JSON no formato de array de rotações esperado pelo frontend
    if best_option['score'] < 0:
        payload_frontend = {
            "rotations": [
                {
                    "id": "A",
                    "crops": [previous_crop, "Climatic Fallow"],
                    "benefits": ["Allows soil moisture and nutrient recovery during extreme weather."],
                    "limitations": best_option['limitations']
                }
            ]
        }
    else:
        payload_frontend = {
            "rotations": [
                {
                    "id": "A",
                    "crops": [previous_crop, best_option['crop']],
                    "benefits": best_option['benefits'],
                    "limitations": best_option['limitations']
                }
            ]
        }
        
    return json.dumps(payload_frontend, indent=2, ensure_ascii=False)