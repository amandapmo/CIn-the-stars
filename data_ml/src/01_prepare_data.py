import pandas as pd
import numpy as np
import os

# Mapping of raw NASA files
raw_files = {
    "petrolina": "data_ml/data/POWER_Point_Daily_20210101_20251231_009d39S_040d50W_LST.csv",
    "cherkasy": "data_ml/data/POWER_Point_Daily_20210101_20251231_049d44N_031d24E_LST.csv",
    "niamey": "data_ml/data/POWER_Point_Daily_20210101_20251231_013d51N_002d13E_LST.csv"
}

print("Starting NASA raw data processing...")

for name, path in raw_files.items():
    if not os.path.exists(path):
        print(f"❌ File not found: {path}")
        continue
        
    print(f"⏳ Processing {name}...")
    
    # 1. Read file skipping the 14 NASA header lines
    df = pd.read_csv(path, skiprows=14)
    
    # 2. Clean nulls (-999 -> NaN) and interpolate missing data
    df = df.replace(-999, np.nan)
    climate_cols = ['T2M', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR']
    present_cols = [c for c in climate_cols if c in df.columns]
    
    df[present_cols] = df[present_cols].interpolate(method='linear', limit=3)
    if 'PRECTOTCORR' in df.columns:
        df['PRECTOTCORR'] = df['PRECTOTCORR'].fillna(0)

    # 3. Extract Month
    dates = pd.to_datetime(df['YEAR'].astype(str) + df['DOY'].astype(str).str.zfill(3), format='%Y%j')
    df['MONTH'] = dates.dt.month

    # 4. Monthly aggregation per year
    monthly_annual = df.groupby(['YEAR', 'MONTH']).agg(
        temp_media=('T2M', 'mean'),
        temp_max_mes=('T2M_MAX', 'max'),
        temp_min_mes=('T2M_MIN', 'min'),
        chuva_acumulada_mm=('PRECTOTCORR', 'sum')
    ).reset_index()

    # 5. Climatology (Historical profile of 12 months)
    climate = monthly_annual.groupby('MONTH').agg(
        temp_media_c=('temp_media', 'mean'),
        temp_min_extrema_c=('temp_min_mes', 'min'),
        temp_max_extrema_c=('temp_max_mes', 'max'),
        chuva_mensal_media_mm=('chuva_acumulada_mm', 'mean')
    ).reset_index()

    # 6. Calculate 3-month rolling seasonal window
    cyclic_climate = pd.concat([climate, climate.iloc[:2]], ignore_index=True)
    rain_3m, avg_temp_3m, min_temp_3m, max_temp_3m = [], [], [], []
    
    for i in range(12):
        window = cyclic_climate.iloc[i:i+3]
        rain_3m.append(window['chuva_mensal_media_mm'].sum())
        avg_temp_3m.append(window['temp_media_c'].mean())
        min_temp_3m.append(window['temp_min_extrema_c'].min())
        max_temp_3m.append(window['temp_max_extrema_c'].max())

    climate['chuva_safra_3m_mm'] = rain_3m
    climate['temp_media_safra_3m_c'] = avg_temp_3m
    climate['temp_min_safra_3m_c'] = min_temp_3m
    climate['temp_max_safra_3m_c'] = max_temp_3m
    
    # 7. Save structured CSV for decision engine
    output_path = f"data_ml/data/seasonal_climate_{name}.csv"
    climate.round(2).to_csv(output_path, index=False)
    print(f"✅ Seasonal file generated: {output_path}")