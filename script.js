// Your OpenWeatherMap API key
const API_KEY = 'b27a65c44a73a52ecf72f50c632be1ac';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// List of predefined cities (in batches)
const predefinedCities = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
    "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", 
    "Kolkata", "Surat", "Pune", "Jaipur", "London", "Paris", "Tokyo", 
    "Sydney", "Moscow", "Rio de Janeiro", "Cape Town", "Beijing", "Toronto", 
    "Dubai", "Berlin", "Madrid", "Rome", "Athens", "Vienna", "Warsaw", 
    "Budapest", "Prague", "Brussels", "Amsterdam", "Coimbatore", "Kochi", 
    "Lucknow", "Patna", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", 
    "Visakhapatnam"
];


const predefinedCityTemps = {};


async function fetchPredefinedCityTemperatures() {
    const batchSize = 10; // Adjust batch size for performance
    for (let i = 0; i < predefinedCities.length; i += batchSize) {
        const citiesBatch = predefinedCities.slice(i, i + batchSize);
        await fetchCitiesBatch(citiesBatch); // Fetch in batches
    }
    
    displayPredefinedCities();
}


async function fetchCitiesBatch(citiesBatch) {
    const promises = citiesBatch.map(city => fetchCityTemperature(city)); 
    await Promise.all(promises); 
}

// Fetch temperature for a given city using the API
async function fetchCityTemperature(city) {
    try {
        const response = await fetch(`${API_URL}?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        if (data.main && data.main.temp) {
            predefinedCityTemps[city] = Math.round(data.main.temp); // Store rounded temperature
        } else {
            console.error(`Could not fetch temperature for ${city}: ${data.message}`);
        }
    } catch (error) {
        console.error(`Error fetching temperature for ${city}:`, error);
    }
}

// Display temperatures in the predefined cities table
function displayPredefinedCities() {
    const tbody = document.querySelector('#city-temperatures tbody');
    tbody.innerHTML = ''; // Clear existing rows

    Object.entries(predefinedCityTemps).forEach(([city, temp]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${city}</td><td>${temp}°C</td>`;
        tbody.appendChild(row);
    });
}

// Compare temperatures of two cities
async function compareTemperatures() {
    const city1 = document.getElementById('city1').value.trim();
    const city2 = document.getElementById('city2').value.trim();

    // Clear previous results
    document.getElementById('city1-result').textContent = '';
    document.getElementById('city2-result').textContent = '';
    document.getElementById('comparison-result').textContent = '';

    // If any input is empty, show a message and return
    if (!city1 || !city2) {
        document.getElementById('comparison-result').textContent = "Both City Fields must be filled before comparing.";
        return;
    }

    // Check if cities are valid
    if (!predefinedCityTemps[city1] && !await isValidCity(city1)) {
        document.getElementById('comparison-result').textContent = `${city1} is not a valid city.`;
        return;
    }

    if (!predefinedCityTemps[city2] && !await isValidCity(city2)) {
        document.getElementById('comparison-result').textContent = `${city2} is not a valid city.`;
        return;
    }

    // Fetch temperatures if not already in the predefined list
    const tempCity1 = predefinedCityTemps[city1] ?? await fetchCityTemperature(city1);
    const tempCity2 = predefinedCityTemps[city2] ?? await fetchCityTemperature(city2);

    if (tempCity1 === null || tempCity2 === null) {
        document.getElementById('comparison-result').textContent =
            "Could not fetch temperature for one or both cities.";
        return;
    }

    // Display individual temperatures
    document.getElementById('city1-result').textContent = `${city1}: ${tempCity1}°C`;
    document.getElementById('city2-result').textContent = `${city2}: ${tempCity2}°C`;

    
    let comparisonMessage;
    if (tempCity1 > tempCity2) {
        comparisonMessage = `${city1} is hotter than ${city2} by ${tempCity1 - tempCity2}°C.`;
    } else if (tempCity2 > tempCity1) {
        comparisonMessage = `${city2} is hotter than ${city1} by ${tempCity2 - tempCity1}°C.`;
    } else {
        comparisonMessage = `Both ${city1} and ${city2} have the same temperature: ${tempCity1}°C.`;
    }

    document.getElementById('comparison-result').textContent = comparisonMessage;
}


async function isValidCity(city) {
    try {
        const response = await fetch(`${API_URL}?q=${city}&appid=${API_KEY}`);
        const data = await response.json();
        return data.cod === 200;
    } catch (error) {
        console.error(`Error validating city: ${error}`);
        return false;
    }
}

// Attach event listeners to city input boxes
document.getElementById('city1').addEventListener('input', checkInputs);
document.getElementById('city2').addEventListener('input', checkInputs);

// Check if both inputs are filled and trigger comparison
function checkInputs() {
    const city1 = document.getElementById('city1').value.trim();
    const city2 = document.getElementById('city2').value.trim();

    // Clear results if any input is empty
    if (!city1 || !city2) {
        document.getElementById('city1-result').textContent = '';
        document.getElementById('city2-result').textContent = '';
        document.getElementById('comparison-result').textContent = '';
        return;
    }

    if (city1 && city2) {
        compareTemperatures();
    }
}


fetchPredefinedCityTemperatures();
