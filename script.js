async function getTemperature(city) {
    const apiKey = 'b27a65c44a73a52ecf72f50c632be1ac'; // Replace with your OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === 200) {
            return { city: city, temperature: data.main.temp, lat: data.coord.lat, lon: data.coord.lon };
        } else {
            return { city: city, error: data.message };
        }
    } catch (error) {
        return { city: city, error: 'Error fetching data' };
    }
}

async function getSatelliteImage(lat, lon) {
    const nasaApiKey = 'K1NrLEiifhLZiv94sxGHlu1CtqX0LxpH2NlrAhyw'; // Replace with your NASA API key
    const date = new Date().toISOString().split('T')[0]; // Use today's date
    
    // Example URL using NASA Earthdata API
    const url = `https://api.nasa.gov/planetary/earth/imagery?lon=${lon}&lat=${lat}&date=${date}&api_key=${nasaApiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.url; // Assuming the API returns an object with a URL field
    } catch (error) {
        console.error('Error fetching satellite image:', error);
        return 'https://via.placeholder.com/300x200?text=Image+Not+Available'; // Placeholder image
    }
}

async function compareTemperatures() {
    const city1 = document.getElementById('city1').value;
    const city2 = document.getElementById('city2').value;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = 'Loading...';

    const [temp1, temp2] = await Promise.all([getTemperature(city1), getTemperature(city2)]);

    let resultsHTML = '';
    if (temp1.error) {
        resultsHTML += `<p>${temp1.city}: ${temp1.error}</p>`;
    } else {
        resultsHTML += `<p>${temp1.city}: ${temp1.temperature}°C</p>`;
        const imageUrl1 = await getSatelliteImage(temp1.lat, temp1.lon);
        document.getElementById('image1').innerHTML = `<img src="${imageUrl1}" alt="Satellite image of ${temp1.city}">`;
    }

    if (temp2.error) {
        resultsHTML += `<p>${temp2.city}: ${temp2.error}</p>`;
    } else {
        resultsHTML += `<p>${temp2.city}: ${temp2.temperature}°C</p>`;
        const imageUrl2 = await getSatelliteImage(temp2.lat, temp2.lon);
        document.getElementById('image2').innerHTML = `<img src="${imageUrl2}" alt="Satellite image of ${temp2.city}">`;
    }

    if (!temp1.error && !temp2.error) {
        const tempDifference = Math.abs(temp1.temperature - temp2.temperature);
        resultsHTML += `<p>Temperature Difference: ${tempDifference}°C</p>`;
    }

    resultsDiv.innerHTML = resultsHTML;
}
