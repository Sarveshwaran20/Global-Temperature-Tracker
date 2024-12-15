const API_KEY = 'b27a65c44a73a52ecf72f50c632be1ac';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// List of predefined cities 
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
    const batchSize = 10; 
    for (let i = 0; i < predefinedCities.length; i += batchSize) {
        const citiesBatch = predefinedCities.slice(i, i + batchSize);
        await fetchCitiesBatch(citiesBatch); 
    }
    
    displayPredefinedCities();
}


async function fetchCitiesBatch(citiesBatch) {
    const promises = citiesBatch.map(city => fetchCityTemperature(city)); 
    await Promise.all(promises); 
}


async function fetchCityTemperature(city) {
    try {
        const response = await fetch(`${API_URL}?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        if (data.main && data.main.temp) {
            predefinedCityTemps[city] = Math.round(data.main.temp);
        } else {
            console.error(`Could not fetch temperature for ${city}: ${data.message}`);
        }
    } catch (error) {
        console.error(`Error fetching temperature for ${city}:`, error);
    }
}


function displayPredefinedCities() {
    const tbody = document.querySelector('#city-temperatures tbody');
    tbody.innerHTML = ''; 

    Object.entries(predefinedCityTemps).forEach(([city, temp]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${city}</td><td>${temp}°C</td>`;
        tbody.appendChild(row);
    });
}

// Compare temperatures of two cities and render the graph
async function compareTemperatures() {
    const city1 = document.getElementById('city1').value.trim();
    const city2 = document.getElementById('city2').value.trim();

    if (!city1 || !city2) {
        document.getElementById('comparison-result').textContent = "Both city fields must be filled.";
        return;
    }

    // Clear previous results
    document.getElementById('city1-result').textContent = '';
    document.getElementById('city2-result').textContent = '';
    document.getElementById('comparison-result').textContent = '';

   
    if (!predefinedCityTemps[city1] && !await isValidCity(city1)) {
        document.getElementById('comparison-result').textContent = `${city1} is not a valid city.`;
        return;
    }
    if (!predefinedCityTemps[city2] && !await isValidCity(city2)) {
        document.getElementById('comparison-result').textContent = `${city2} is not a valid city.`;
        return;
    }

    
    const city1Temps = await fetchYearlyTemperatures(city1);
    const city2Temps = await fetchYearlyTemperatures(city2);

    if (!city1Temps || !city2Temps) {
        document.getElementById('comparison-result').textContent =
            "Could not fetch yearly temperatures for one or both cities.";
        return;
    }

    
    const city1AvgTemp = calculateAverageTemperature(city1Temps);
    const city2AvgTemp = calculateAverageTemperature(city2Temps);

    document.getElementById('city1-result').textContent = `${city1}: ${city1AvgTemp}°C`;
    document.getElementById('city2-result').textContent = `${city2}: ${city2AvgTemp}°C`;

    
    const tempDifference = Math.abs(city1AvgTemp - city2AvgTemp);
    const hotterCity = city1AvgTemp > city2AvgTemp ? city1 : city2;
    document.getElementById('comparison-result').textContent = `${hotterCity} is hotter by ${tempDifference}°C`;

    
    renderYearlyTemperatureGraph(city1, city1Temps, city2, city2Temps);

    // Fetch and display forecast
    const forecast1 = await fetchCityForecast(city1);
    const forecast2 = await fetchCityForecast(city2);

    if (forecast1 && forecast2) {
        displayForecast(city1, forecast1, city2, forecast2);
    }
}

// Calculate average temperature from monthly data
function calculateAverageTemperature(temps) {
    const total = Object.values(temps).reduce((sum, temp) => sum + temp, 0);
    return Math.round(total / Object.values(temps).length);
}


async function fetchYearlyTemperatures(city) {
    try {
        const response = await fetch(`${API_URL}?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        if (data.main && data.main.temp) {
            
            const currentTemp = Math.round(data.main.temp);
            const monthlyTemps = simulateMonthlyTemperatures(currentTemp);
            return monthlyTemps;
        } else {
            console.error(`Could not fetch temperature for ${city}: ${data.message}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching yearly temperatures for ${city}:`, error);
        return null;
    }
}

// Simulate realistic monthly temperature variations
function simulateMonthlyTemperatures(currentTemp) {
    const monthlyTemps = {};
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    months.forEach((month, index) => {
     
        const variation = (Math.random() - 0.5) * 5;
        monthlyTemps[month] = Math.round(currentTemp + variation);
    });

    return monthlyTemps;
}

// Render the graph
function renderYearlyTemperatureGraph(city1, city1Temps, city2, city2Temps) {
    const ctx = document.getElementById('yearlyTemperatureGraph').getContext('2d');
    const labels = Object.keys(city1Temps); 
    const dataCity1 = Object.values(city1Temps);
    const dataCity2 = Object.values(city2Temps);

    // Destroy existing chart
    if (window.yearlyChart) {
        window.yearlyChart.destroy();
    }

    // Create new chart
    window.yearlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: city1,
                    data: dataCity1,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 1,
                },
                {
                    label: city2,
                    data: dataCity2,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index' },
            },
            scales: {
                x: { title: { display: true, text: 'Months' } },
                y: { title: { display: true, text: 'Temperature (°C)' } },
            },
        },
    });
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

// Fetch 5-day forecast for a given city using the API
async function fetchCityForecast(city) {
    try {
        const response = await fetch(`${FORECAST_API_URL}?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        if (data.list) {
            const forecast = [];
            const uniqueDates = new Set();
            for (const entry of data.list) {
                const date = entry.dt_txt.split(' ')[0];
                if (!uniqueDates.has(date)) {
                    uniqueDates.add(date);
                    forecast.push({
                        date: date,
                        minTemp: entry.main.temp_min,
                        maxTemp: entry.main.temp_max
                    });
                    if (forecast.length === 5) break;
                }
            }
            return forecast;
        } else {
            console.error(`Could not fetch forecast for ${city}: ${data.message}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching forecast for ${city}:`, error);
        return null;
    }
}

// Display forecast in the forecast table
function displayForecast(city1, forecast1, city2, forecast2) {
    const tbody = document.querySelector('#forecast-table tbody');
    tbody.innerHTML = ''; // Clear existing rows

    for (let i = 0; i < 5; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${forecast1[i].date}</td>
            <td>${forecast1[i].minTemp}°C</td>
            <td>${forecast1[i].maxTemp}°C</td>
            <td>${forecast2[i].minTemp}°C</td>
            <td>${forecast2[i].maxTemp}°C</td>
        `;
        tbody.appendChild(row);
    }

    
    const headers = document.querySelectorAll('#forecast-table th');
    headers[1].textContent = `Min Temp (${city1})`;
    headers[2].textContent = `Max Temp (${city1})`;
    headers[3].textContent = `Min Temp (${city2})`;
    headers[4].textContent = `Max Temp (${city2})`;
}

// Attach event listeners to city input boxes
document.getElementById('city1').addEventListener('input', clearResults);
document.getElementById('city2').addEventListener('input', clearResults);

// Clear results if any input is empty
function clearResults() {
    const city1 = document.getElementById('city1').value.trim();
    const city2 = document.getElementById('city2').value.trim();

    if (!city1 || !city2) {
        document.getElementById('city1-result').textContent = '';
        document.getElementById('city2-result').textContent = '';
        document.getElementById('comparison-result').textContent = '';
    }
}

// Trigger comparison when the "Compare" button is clicked
document.getElementById('compare-button').addEventListener('click', compareTemperatures);

// Trigger comparison when Enter key is pressed
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        compareTemperatures();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const inputFields = document.querySelectorAll('.input-section input');
    const graphContainer = document.getElementById('yearlyTemperatureGraph');
    const forecastTableBody = document.querySelector('#forecast-table tbody');

    inputFields.forEach(input => {
        input.addEventListener('input', function() {
            if (input.value.trim() === '') {
                graphContainer.innerHTML = ''; 
                forecastTableBody.innerHTML = ''; 
                document.getElementById('city1-result').textContent = ''; 
                document.getElementById('city2-result').textContent = ''; 
                document.getElementById('comparison-result').textContent = ''; 
                if (window.yearlyChart) {
                    window.yearlyChart.destroy(); 
                    window.yearlyChart = null; 
                }
            }
        });
    });

    
    function adjustChartSize() {
        const chartContainer = document.getElementById('chart-container');
        if (window.innerWidth < 768) {
            chartContainer.style.width = '100%';
            chartContainer.style.height = '300px';
        } else {
            chartContainer.style.width = '600px';
            chartContainer.style.height = '400px';
        }
    }

    function adjustLayout() {
        const container = document.querySelector('.container');
        if (window.innerWidth < 768) {
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
        } else {
            container.style.flexDirection = 'row';
            container.style.alignItems = 'flex-start';
        }
    }

    window.addEventListener('resize', () => {
        adjustChartSize();
        adjustLayout();
    });

    adjustChartSize(); // Initial call to set the size based on current window size
    adjustLayout(); // Initial call to set the layout based on current window size
});

fetchPredefinedCityTemperatures();
