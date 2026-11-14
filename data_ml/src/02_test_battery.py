import json
import random
import pandas as pd
from rotation_engine import generate_mvp_recommendation

climate_files = [
    "data_ml/data/seasonal_climate_petrolina.csv",
    "data_ml/data/seasonal_climate_cherkasy.csv",
    "data_ml/data/seasonal_climate_niamey.csv"
]

# Update previous crops to match the english engine
previous_crops = ["Corn", "Cassava", "Cowpea", "Forage Cactus"]

print("\n" + "="*50)
print("Starting 25-test audit of the MVP Engine...")
print("="*50)

results = []
for i in range(1, 26):
    file_path = random.choice(climate_files)
    prev_crop = random.choice(previous_crops)
    
    # Call engine for random combination
    result_json = generate_mvp_recommendation(file_path, prev_crop)
    data = json.loads(result_json)
    
    # Extract rotation data from the new JSON format
    rotation = data['rotations'][0]
    suggested_crop = rotation['crops'][1] # The second item is the recommendation
    
    # Extract region name from file
    region = file_path.split('_')[-1].replace('.csv', '').title()
    
    results.append({
        "Test": i,
        "Region": region,
        "Previous_Crop": prev_crop,
        "Recommended": suggested_crop
    })

df_test = pd.DataFrame(results)
df_test.to_csv("data_ml/data/audit_25_tests.csv", index=False)

print(df_test[['Test', 'Region', 'Previous_Crop', 'Recommended']].head(10).to_string(index=False))