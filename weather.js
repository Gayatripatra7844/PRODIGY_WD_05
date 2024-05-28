let appId = '71f6779186cc32448b4c412eea65b982';
let units = 'metric'; 
let searchMethod; 

function getSearchMethod(searchTerm) {
    if(searchTerm.length === 5 && Number.parseInt(searchTerm) + '' === searchTerm)
        searchMethod = 'zip';
    else 
        searchMethod = 'q';
}

function searchWeather(searchTerm) {
    getSearchMethod(searchTerm);
    fetch(`http://api.openweathermap.org/data/2.5/weather?${searchMethod}=${searchTerm}&APPID=${appId}&units=${units}`)
        .then((result) => result.json())
        .then((weatherData) => {
            fetchOneCallAPI(weatherData.coord.lat, weatherData.coord.lon, weatherData.name);
        });
}

function fetchOneCallAPI(lat, lon, city) {
    fetch(`http://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=${units}&appid=${appId}`)
        .then((result) => result.json())
        .then((weatherData) => {
            updateUI(weatherData, city);
        });
}

function updateUI(data, city) {
    const locationElem = document.getElementById('location');
    const dateElem = document.getElementById('date');
    const greetingElem = document.getElementById('greeting');
    const currentTempElem = document.getElementById('current-temp');
    const windSpeedElem = document.getElementById('wind-speed');
    const humidityElem = document.getElementById('humidity');
    const currentWeatherElem = document.getElementById('current-weather');
    const currentTimeElem = document.getElementById('current-time');
    const feelsLikeElem = document.getElementById('feels-like');
    const currentDescriptionElem = document.getElementById('current-description');
    const dailyForecastContainer = document.getElementById('daily-forecast');
    const hourlyForecastContainer = document.getElementById('hourly-forecast-container');

    const currentDate = new Date();
    locationElem.innerText = city;
    dateElem.innerText = currentDate.toLocaleDateString();

    const hours = currentDate.getHours();
    if (hours < 12) {
        greetingElem.innerText = 'Good Morning';
    } else if (hours < 18) {
        greetingElem.innerText = 'Good Afternoon';
    } else {
        greetingElem.innerText = 'Good Evening';
    }

    currentTempElem.innerText = `${Math.round(data.current.temp)}°`;
    windSpeedElem.innerText = `${data.current.wind_speed} mph`;
    humidityElem.innerText = `${data.current.humidity}%`;
    currentWeatherElem.innerText = data.current.weather[0].main;
    currentTimeElem.innerText = currentDate.toLocaleTimeString();
    feelsLikeElem.innerText = `${Math.round(data.current.temp)}° Feels like ${Math.round(data.current.feels_like)}°`;
    currentDescriptionElem.innerText = data.current.weather[0].description;

    dailyForecastContainer.innerHTML = '';
    const todayElem = document.createElement('div');
    todayElem.classList.add('forecast-card');
    todayElem.innerHTML = `
        <div class="text-lg">Today</div>
        <div class="text-2xl">${Math.round(data.daily[0].temp.day)}°</div>
        <div class="text-lg">${data.daily[0].weather[0].main}</div>
    `;
    dailyForecastContainer.appendChild(todayElem);

    for (let i = 1; i < 6; i++) {
        const day = data.daily[i];
        const dayElem = document.createElement('div');
        dayElem.classList.add('forecast-card');
        dayElem.innerHTML = `
            <div class="text-lg">${new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' })}</div>
            <div class="text-2xl">${Math.round(day.temp.day)}°</div>
            <div class="text-lg">${day.weather[0].main}</div>
        `;
        dailyForecastContainer.appendChild(dayElem);
    }

    hourlyForecastContainer.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
        const hour = data.hourly[i];
        const hourElem = document.createElement('div');
        hourElem.classList.add('forecast-card');
        hourElem.innerHTML = `
            <div class="text-lg">${new Date(hour.dt * 1000).getHours() % 12 || 12} ${new Date(hour.dt * 1000).getHours() >= 12 ? 'PM' : 'AM'}</div>
            <div class="text-2xl">${Math.round(hour.temp)}°</div>
            <div class="text-lg">${hour.weather[0].main}</div>
        `;
        hourlyForecastContainer.appendChild(hourElem);
    }

    updateBackground(data.current.weather[0].main);
}

function updateBackground(weatherCondition) {
    let backgroundImageUrl = '';
    switch (weatherCondition) {
        case 'Clear':
            backgroundImageUrl = "url('clearPicture.jpg')";
            break;
        case 'Clouds':
            backgroundImageUrl = "url('cloudyPicture.jpg')";
            break;
        case 'Rain':
        case 'Drizzle':
            backgroundImageUrl = "url('rainPicture.jpg')";
            break;
        case 'Mist':
            backgroundImageUrl = "url('mistPicture.jpg')";
            break;
        case 'Thunderstorm':
            backgroundImageUrl = "url('stormPicture.jpg')";
            break;
        case 'Snow':
            backgroundImageUrl = "url('snowPicture.jpg')";
            break;
        default:
            backgroundImageUrl = '';
            break;
    }
    document.body.style.backgroundImage = backgroundImageUrl;
}

document.getElementById('search-button').addEventListener('click', () => {
    let searchTerm = document.getElementById('city-input').value;
    if (searchTerm) {
        searchWeather(searchTerm);
    }
});

// Add event listener for "keydown" event on the input field
document.getElementById('city-input').addEventListener('keydown', (event) => {
    // Check if the key pressed is "Enter" (key code 13)
    if (event.key === 'Enter') {
        // Prevent the default behavior of the "Enter" key (form submission)
        event.preventDefault();
        // Retrieve the value entered by the user
        let searchTerm = document.getElementById('city-input').value;
        // Check if the input field is not empty
        if (searchTerm) {
            // Call the searchWeather function with the entered city name
            searchWeather(searchTerm);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    askForLocation();
});

function askForLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            // Reverse geocoding to get city name from coordinates
            const city = await getCityName(latitude, longitude);
            fetchOneCallAPI(latitude, longitude, city);
        }, () => {
            alert('Unable to retrieve your location. Please search for a city.');
        });
    } else {
        alert('Geolocation is not supported by your browser. Please search for a city.');
    }
}

async function getCityName(latitude, longitude) {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${appId}`);
    const data = await response.json();
    if (data && data[0] && data[0].name) {
        return data[0].name;
    } else {
        return 'Your Location';
    }
}


function searchWeather(searchTerm) {
    getSearchMethod(searchTerm);
    fetch(`http://api.openweathermap.org/data/2.5/weather?${searchMethod}=${searchTerm}&APPID=${appId}&units=${units}`)
        .then((result) => {
            if (!result.ok) {
                throw new Error('City not found. Please enter a valid city name.');
            }
            return result.json();
        })
        .then((weatherData) => {
            fetchOneCallAPI(weatherData.coord.lat, weatherData.coord.lon, weatherData.name);
        })
        .catch((error) => {
            alert(error.message);
        });
}
