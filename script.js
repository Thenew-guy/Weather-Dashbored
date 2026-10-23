// Variables to hold our chart objects so we can delete them when updating
let forecastChart = null;
let compareChart = null;

// Run this when the page first loads
window.onload = function() {
    console.log("Dashboard loaded. Fetching initial data...");
    getWeather();
};

// Event Listeners for buttons
document.getElementById("searchBtn").addEventListener("click", getWeather);
document.getElementById("compareBtn").addEventListener("click", compareCities);

// Helper function to convert city name to Latitude and Longitude
async function getCoordinates(cityName) {
    let url = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`;
    let response = await fetch(url);
    let data = await response.json();
    
    if (data.results && data.results.length > 0) {
        return data.results[0]; // Return the first matching city
    } else {
        alert("Sorry, city not found: " + cityName);
        return null;
    }
}

// Function to get and display main weather data
async function getWeather() {
    let city = document.getElementById("cityInput").value;
    console.log("Getting weather for: " + city);
    
    let coords = await getCoordinates(city);
    if (coords == null) return; // Stop if city wasn't found

    // API URLs
    let weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    let aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.latitude}&longitude=${coords.longitude}&current=european_aqi`;

    try {
        // Fetch Weather Data
        let weatherRes = await fetch(weatherUrl);
        let weatherData = await weatherRes.json();

        // Fetch AQI Data
        let aqiRes = await fetch(aqiUrl);
        let aqiData = await aqiRes.json();

        // 1. Update HTML Text
        document.getElementById("tempDisplay").innerText = weatherData.current_weather.temperature + "°C";
        document.getElementById("windDisplay").innerText = weatherData.current_weather.windspeed;
        
        let aqi = aqiData.current.european_aqi;
        document.getElementById("aqiDisplay").innerText = aqi;
        
        // Simple logic for AQI status
        if (aqi < 50) {
            document.getElementById("aqiStatus").innerText = "Good 🟢";
        } else if (aqi < 100) {
            document.getElementById("aqiStatus").innerText = "Moderate 🟡";
        } else {
            document.getElementById("aqiStatus").innerText = "Poor 🔴";
        }

        // 2. Weather Alert Logic
        let alertBox = document.getElementById("weatherAlert");
        if (weatherData.current_weather.temperature > 35) {
            alertBox.classList.remove("hidden");
            document.getElementById("alertMsg").innerText = "High Temperature Warning!";
        } else if (weatherData.current_weather.windspeed > 40) {
            alertBox.classList.remove("hidden");
            document.getElementById("alertMsg").innerText = "High Wind Warning!";
        } else {
            alertBox.classList.add("hidden"); 
        }

        // 3. Update the Line Chart
        drawForecastChart(weatherData.daily.time, weatherData.daily.temperature_2m_max, weatherData.daily.temperature_2m_min);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Function to draw the main line chart
function drawForecastChart(dates, maxTemps, minTemps) {
    let ctx = document.getElementById('forecastChart').getContext('2d');
    
    // Destroy the old chart before making a new one
    if (forecastChart != null) {
        forecastChart.destroy();
    }

    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Max Temp (°C)',
                    data: maxTemps,
                    borderColor: 'red',
                    fill: false
                },
                {
                    label: 'Min Temp (°C)',
                    data: minTemps,
                    borderColor: 'blue',
                    fill: false
                }
            ]
        }
    });
}

// Function to compare two cities
async function compareCities() {
    let city1 = document.getElementById("city1").value;
    let city2 = document.getElementById("city2").value;

    console.log("Comparing " + city1 + " and " + city2);

    let coords1 = await getCoordinates(city1);
    let coords2 = await getCoordinates(city2);

    if (coords1 == null || coords2 == null) return;

    try {
        let url1 = `https://api.open-meteo.com/v1/forecast?latitude=${coords1.latitude}&longitude=${coords1.longitude}&daily=temperature_2m_max&timezone=auto`;
        let url2 = `https://api.open-meteo.com/v1/forecast?latitude=${coords2.latitude}&longitude=${coords2.longitude}&daily=temperature_2m_max&timezone=auto`;

        let res1 = await fetch(url1);
        let data1 = await res1.json();

        let res2 = await fetch(url2);
        let data2 = await res2.json();

        // Draw the Bar Chart
        drawCompareChart(data1.daily.time, city1, data1.daily.temperature_2m_max, city2, data2.daily.temperature_2m_max);
    } catch (error) {
        console.error("Error fetching comparison data:", error);
    }
}

// Function to draw the comparison bar chart
function drawCompareChart(dates, name1, data1, name2, data2) {
    let ctx = document.getElementById('compareChart').getContext('2d');
    
    if (compareChart != null) {
        compareChart.destroy();
    }

    compareChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: name1 + ' Max Temp (°C)',
                    data: data1,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)' // Blue
                },
                {
                    label: name2 + ' Max Temp (°C)',
                    data: data2,
                    backgroundColor: 'rgba(231, 76, 60, 0.7)' // Red
                }
            ]
        }
    });
}