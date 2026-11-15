from rotation_engine import generate_mvp_recommendation

def test_global_coordinates(lat, lon, previous_crop="Corn"):
    print(f"Querying NASA POWER API for Lat: {lat}, Lon: {lon}...")
    result_json = generate_mvp_recommendation(lat=lat, lon=lon, previous_crop=previous_crop)
    return result_json

if __name__ == "__main__":
    print("\nTEST 1: Sahara Desert (Egypt) - Absolute Drought")
    print(test_global_coordinates(lat=26.8206, lon=30.8025, previous_crop="Corn"))

    print("\nTEST 2: Sinop/MT (Brazil) - Hot and Rainy Climate")
    print(test_global_coordinates(lat=-11.8643, lon=-55.5059, previous_crop="Cassava"))

    print("\nTEST 3: Norilsk (Russia) - Extreme Cold/Snow")
    print(test_global_coordinates(lat=69.3558, lon=88.1893, previous_crop="Corn"))

    print("\nTEST 4: Jakarta (Indonesia) - Tropical Rainforest (Hot & Very Wet)")
    print(test_global_coordinates(lat=-6.2088, lon=106.8456, previous_crop="Corn"))

    print("\nTEST 5: Alice Springs (Australia) - Arid Outback (Hot & Dry)")
    print(test_global_coordinates(lat=-23.6980, lon=133.8807, previous_crop="Cowpea"))

    print("\nTEST 6: La Paz (Bolivia) - High Altitude Andes (Cold & Frost Risk)")
    print(test_global_coordinates(lat=-16.4897, lon=-68.1193, previous_crop="Cassava"))

    print("\nTEST 7: Des Moines, Iowa (USA) - US Corn Belt (Temperate)")
    print(test_global_coordinates(lat=41.5868, lon=-93.6250, previous_crop="Forage Cactus"))

    print("\nTEST 8: Paris (France) - Western Europe (Mild & Moderate Rain)")
    print(test_global_coordinates(lat=48.8566, lon=2.3522, previous_crop="Corn"))