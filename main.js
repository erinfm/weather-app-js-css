/* eslint-env browser */
/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
// if (process.env.NODE_ENV !== 'production') {
//   require('dotenv').config();
// }

const HERE_API_CODE = config.hereAPICode;
const HERE_API_ID = config.hereAPIId;
const OWM_API_KEY = config.OWMAPIKey;
const locationIdArray = [];

let currentBackground = '.has-background-default';
let currentDate = '';
let currentTemp = '';
let inputValue = '';
let selectedCity = '';
let selectedCityId = '';
let weatherIcon = '';

const inputPage = document.getElementById('inputPage');
const inputField = document.getElementById('inputField');
const datalist = document.getElementById('datalist');
const datalistSelect = document.getElementById('datalistSelect');
const weatherBtn = document.getElementById('weatherBtn');
const resultPage = document.getElementById('resultPage');
const resultContainer = document.getElementById('resultContainer');
const tempIconContainer = document.getElementById('tempIconContainer');
const weatherTextContainer = document.getElementById('weatherTextContainer');
const tempContainer = document.getElementById('tempContainer');
const cityDateContainer = document.getElementById('cityDateContainer');
const searchAgainBtnContainer = document.getElementById('searchAgainBtnContainer');
const searchAgainBtn = document.getElementById('searchAgainBtn');
const cityList = document.getElementById('cityList');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModalBtn');

inputField.addEventListener('input', () => onInput());

inputField.addEventListener('keydown', e => {
  // Check if key pressed is return key
  if (e.keyCode === 13) {
    console.log('searching-input');
    inputValue = inputField.value.toUpperCase();
    // If no country yet specified, get city/country data from API first, else get coordinates of location
    if (inputValue.includes(',')) getCoordinates();
    else getCityData();
  }
});

// When user picks a city, the input field is updated to reflect
cityList.addEventListener('click', e => {
  console.log(e.target.value);
  inputField.value = e.target.value;
  modal.classList.toggle('closed');
  inputPage.classList.toggle('darken');
  inputPage.classList.toggle('unselectable');
  onInput();
});

closeModalBtn.addEventListener('click', () => {
  modal.classList.toggle('closed');
  inputPage.classList.toggle('darken');
  inputPage.classList.toggle('unselectable');
});

weatherBtn.addEventListener('click', e => {
  console.log('searching-button');
  // e.preventDefault();
  inputValue = inputField.value.toUpperCase();
  // If no country yet specified, get city/country data from API first, else get coordinates of location
  if (inputValue.includes(',')) getCoordinates();
  else getCityData();
});

searchAgainBtn.addEventListener('click', () => onReturnButtonPress());

// Catch when user is using keyboard navigation, and show outlines accordingly
function handleKeyboardNav(e) {
  if (e.keyCode === 9) {
    document.body.classList.add('keyboard-nav');
    window.removeEventListener('keydown', handleKeyboardNav);
  }
}

window.addEventListener('keydown', handleKeyboardNav);

const onInput = function onInputByUser() {
  const val = document.getElementById('inputField').value;
  const opts = document.getElementById('cityList').childNodes;
  for (let i = 0; i < opts.length; i += 1) {
    if (opts[i].value === val) {
      // An item was selected from the list!
      selectedCity = opts[i].value
        .toLowerCase()
        .split(' ')
        .map(s => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
      selectedCityId = opts[i].id;
      break;
    }
  }
};

const getCoordinates = function getCoordinatesFromAPI() {
  console.log('getcoordinates');
  fetch(
    `http://geocoder.api.here.com/6.2/geocode.json?locationid=${selectedCityId}&jsonattributes=1&gen=9&app_id=${HERE_API_ID}&app_code=${HERE_API_CODE}`
  )
    .then(response => response.json())
    .then(data => {
      console.log(data);
      const latitude = data.response.view['0'].result['0'].location.displayPosition.latitude;
      const longitude = data.response.view['0'].result['0'].location.displayPosition.longitude;
      fetchWeather(latitude, longitude);
    })
    .catch(e => console.log('Error found!', e));
};

function getCityData() {
  console.log('getCityData');
  // Make GET request to HERE API for place data matching user input
  fetch(
    `http://autocomplete.geocoder.api.here.com/6.2/suggest.json?app_id=${HERE_API_ID}&app_code=${HERE_API_CODE}&resultType=areas&language=en&maxresults=5&query=${inputValue}`
  )
    .then(response => response.json())
    .then(data => {
      // Extract placename info from JSON
      const responseData = data.suggestions;
      // Run function to show matching cities in datalist dropdown
      if (responseData.length > 0) {
        showCities(responseData);
      }
    })
    .catch(e => console.log('Error found!', e));
}

// Show cities that match user input in dropdown
function showCities(responseData) {
  const duplicatePreventer = [];
  // Remove all datalist items from previous searches first
  while (cityList.firstChild) cityList.removeChild(cityList.firstChild);
  responseData.forEach(data => {
    // If data doesn't contain a city name, disregard it
    if (data.address.city) {
      // Clean up data and edit into 'city, country' format
      const cityName = data.address.city.toUpperCase();
      const countryName = data.address.country.toUpperCase();
      // Add matching, non-duplicate values to datalist
      if (cityName.indexOf(inputValue) !== -1 && duplicatePreventer.indexOf(countryName) === -1) {
        const fullPlacename = `${cityName}, ${countryName}`;
        // Create new <option> element
        const option = document.createElement('p');
        option.className = 'locationOption';
        option.id = data.locationId;
        option.value = fullPlacename;
        option.innerText = fullPlacename.toLowerCase();
        // Add the <option> element to the <datalist>
        cityList.appendChild(option);
        // Add country to array so same city isn't shown twice
        duplicatePreventer.push(countryName);
        // Add location ID to locationIdArray
        locationIdArray.push(data.locationId);
      }
    }
  });
  if (locationIdArray.length > 0) {
    console.log('opening');
    modal.classList.toggle('closed');
    inputPage.classList.toggle('darken');
    inputPage.classList.toggle('unselectable');
  }
}

function fetchWeather(latitude, longitude) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OWM_API_KEY}`
  )
    .then(response => response.json())
    .then(data => {
      console.log(data);
      // hide initial inputs and display weather data
      inputPage.classList.toggle('is-hidden');
      resultPage.classList.toggle('is-hidden');
      getWeather(data);
    })
    .catch(e => console.log('Error found!', e));
}

const getWeather = function getWeatherInfoAndDisplay(data) {
  getWeatherIcon(data);
  displayWeatherIcon();

  displayWeatherDetails(data);
  displayTemp(data);
  displayCityName();
  getCurrentDate();
  displayCurrentDate();
  toggleBackgroundImg();
};

function getWeatherIcon(data) {
  // Get weather type ID from API and show corresponding font awesome icon
  switch (true) {
    // Thunderstorms
    case data.weather['0'].id > 199 && data.weather['0'].id < 233:
      weatherIcon = 'img/storm.png';
      break;
    // Drizzle
    case data.weather['0'].id > 299 && data.weather['0'].id < 322:
      weatherIcon = 'img/light-rain.png';
      break;
    // Light rain
    case data.weather['0'].id === 500 ||
      data.weather['0'].id === 520 ||
      data.weather['0'].id === 521:
      weatherIcon = 'img/light-rain.png';
      break;
    // Moderate to heavy rain
    case (data.weather['0'].id > 500 && data.weather['0'].id < 512) ||
      (data.weather['0'].id > 521 && data.weather['0'].id < 532):
      weatherIcon = 'img/heavy-rain.png';
      break;
    // Sleet
    // TODO: Create sleet icon
    case data.weather['0'].id > 610 && data.weather['0'].id < 617:
      weatherIcon = 'img/snow.png';
      break;
    // Snow
    case (data.weather['0'].id > 599 && data.weather['0'].id < 603) ||
      (data.weather['0'].id > 619 && data.weather['0'].id < 623):
      weatherIcon = 'img/snow.png';
      break;
    // Atmosphere
    // TODO: Create fog icon
    case data.weather['0'].id > 699 && data.weather['0'].id < 782:
      weatherIcon = 'img/snow.png';
      break;
    // Light clouds
    case data.weather['0'].id === 801 || data.weather['0'].id === 802:
      weatherIcon = 'img/light-cloud.png';
      break;
    // Heavy clouds
    case data.weather['0'].id === 803 || data.weather['0'].id === 804:
      weatherIcon = 'img/heavy-cloud.png';
      break;
    // Else, clear
    default:
      weatherIcon = 'img/sunny.png';
      break;
  }
}

function displayWeatherIcon() {
  const weatherIconImage = document.createElement('img');
  weatherIconImage.setAttribute('src', `${weatherIcon}`);
  tempIconContainer.appendChild(weatherIconImage);
}

function getCurrentDate() {
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  currentDate = `${new Date().toLocaleTimeString('en-GB', options)}`;
}

function displayCurrentDate() {
  const dateBox = document.createElement('p');
  const dateBoxText = document.createTextNode(`${currentDate}`);
  dateBox.appendChild(dateBoxText);
  dateBox.classList.add('resultDate');
  cityDateContainer.appendChild(dateBox);
}

function displayWeatherDetails(data) {
  const weatherInfoBox = document.createElement('p');
  const weatherInfoText = document.createTextNode(`${data.weather['0'].description}`);
  weatherInfoBox.appendChild(weatherInfoText);
  weatherInfoBox.classList.add('weatherInfo');
  weatherTextContainer.appendChild(weatherInfoBox);
}

function displayTemp(data) {
  currentTemp = data.main.temp;
  const tempTextBox = document.createElement('h2');
  const tempText = document.createTextNode(`${Math.round(data.main.temp)}°C`);

  tempTextBox.appendChild(tempText);
  if (tempText.length > 4) {
    tempTextBox.classList.add('resultTempBox');
  } else {
    tempTextBox.classList.add('resultTempText');
  }
  tempContainer.appendChild(tempTextBox);
}

function displayCityName() {
  const cityNameBox = document.createElement('p');
  const cityNameBoxText = document.createTextNode(`${selectedCity}`);
  cityNameBox.appendChild(cityNameBoxText);
  cityNameBox.classList.add('resultCityName');
  cityDateContainer.appendChild(cityNameBox);
}

function toggleBackgroundImg() {
  if (currentTemp < 30) {
    resultPage.classList.remove('has-background-default');
    resultPage.classList.add('has-background-day-cool');
    currentBackground = 'has-background-day-cool';
  }
  if (currentTemp > 30) {
    resultPage.classList.remove('has-background-default');
    resultPage.classList.add('has-background-day-warm');
    currentBackground = 'has-background-day-warm';
  }
  if (weatherIcon === 'img/snow.png') {
    resultPage.classList.remove('has-background-default');
    resultPage.classList.add('has-background-snow-mist');
    currentBackground = 'has-background-snow-mist';
  }
  if (weatherIcon === 'img/heavy-rain-icon.png' || weatherIcon === 'img/storm.png') {
    resultPage.classList.remove('has-background-default');
    resultPage.classList.add('has-background-dark');
    currentBackground = 'has-background-dark';
  }
}

function onReturnButtonPress() {
  // Remove data elements generated during previous search
  while (tempIconContainer.firstChild) {
    tempIconContainer.removeChild(tempIconContainer.firstChild);
  }
  while (weatherTextContainer.firstChild) {
    weatherTextContainer.removeChild(weatherTextContainer.firstChild);
  }
  while (tempContainer.firstChild) {
    tempContainer.removeChild(tempContainer.firstChild);
  }
  while (cityDateContainer.firstChild) {
    cityDateContainer.removeChild(cityDateContainer.firstChild);
  }
  while (cityList.firstChild) {
    cityList.removeChild(cityList.firstChild);
  }
  inputField.value = '';
  resultPage.classList.remove(`${currentBackground}`);
  resultPage.classList.add('has-background-default');
  inputPage.classList.toggle('is-hidden');
  resultPage.classList.toggle('is-hidden');
  inputField.focus();
  currentTemp = '';
}
