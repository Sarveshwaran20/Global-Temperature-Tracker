import csv
import random

def generate_temperature_data(filename="global_temperatures.csv", start_year=2000, end_year=2024):
    """
    Generates a CSV file with random global temperature data for each year.
    """
    with open(filename, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Year", "Temperature"])
        for year in range(start_year, end_year + 1):
            # Generate a random temperature anomaly between 13.5°C and 15.0°C
            temp = round(random.uniform(13.5, 15.0), 2)
            writer.writerow([year, temp])
    print(f"Sample data written to {filename}")

if __name__ == "__main__":
    generate_temperature_data()