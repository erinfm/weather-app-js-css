/* eslint-env browser */
/* eslint-disable no-use-before-define */
/* eslint-disable no-console */

const hereAPICode = config.hereAPICode;
const hereAPIId = config.hereAPIId;
const OWMAPIKey = config.OWMAPIKey;

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
const datalistSelect = document.getElementById('datalistSelect')
const weatherBtn = document.getElementById('weatherBtn');
const resultPage = document.getElementById('resultPage');
const resultContainer = document.getElementById('resultContainer');
const tempIconContainer = document.getElementById('tempIconContainer');
const weatherDataContainer = document.getElementById('weatherDataContainer');
const searchAgainBtnContainer = document.getElementById('searchAgainBtnContainer');
const searchAgainBtn = document.getElementById('searchAgainBtn');

inputField.addEventListener('input', () => onInput());

inputField.addEventListener('keydown', e => {
  // Check if key pressed is return key
  if (e.keyCode === 13) {
    console.log('searching-input')
    inputValue = inputField.value.toUpperCase();
    // If no country yet specified, get city/country data from API first, else get coordinates of location
    if (inputValue.includes(',')) getCoordinates();
    else getCityData();
  }
});

// If user picks a city from the datalist select element, the input field is updated accordingly
datalistSelect.addEventListener('click', e => {
  console.log(e.target.value)
  inputField.value = e.target.value
  onInput()
})

weatherBtn.addEventListener('click', e => {
  console.log('searching-button')
  // e.preventDefault();
  inputValue = inputField.value.toUpperCase();
  // If no country yet specified, get city/country data from API first, else get coordinates of location
  if (inputValue.includes(',')) getCoordinates();
  else getCityData();
});

searchAgainBtn.addEventListener('click', () => onReturnButtonPress());

const onInput = function onInputByUser() {
  const val = document.getElementById('inputField').value;
  const opts = document.getElementById('datalistSelect').childNodes;
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
  console.log('getcoordinates')
  fetch(
    `http://geocoder.api.here.com/6.2/geocode.json?locationid=${selectedCityId}&jsonattributes=1&gen=9&app_id=${hereAPIId}&app_code=${hereAPICode}`
  )
    .then(response => response.json())
    .then(data => {
      console.log(data)
      const latitude =
        data.response.view['0'].result['0'].location.displayPosition.latitude;
      const longitude =
        data.response.view['0'].result['0'].location.displayPosition.longitude;
      fetchWeather(latitude, longitude);
    })
    .catch(e => console.log('Error found!', e));
};

const getCityData = function getCityDataFromAPI() {
  console.log('getCityData')
  // Make GET request to HERE API for place data matching user input
  fetch(
    `http://autocomplete.geocoder.api.here.com/6.2/suggest.json?app_id=${hereAPIId}&app_code=${hereAPICode}&resultType=areas&language=en&maxresults=5&query=${inputValue}`
  )
    .then(response => response.json())
    .then(data => {
      // Extract placename info from JSON
      const responseData = data.suggestions;
      // Run function to show matching cities in datalist dropdown
      showCities(responseData);
    })
    .catch(e => console.log('Error found!', e));
};

// Show cities that match user input in dropdown
const showCities = function showCitiesInDropdown(responseData) {
  const duplicatePreventer = [];
  // Remove all datalist items from previous searches first
  while (datalistSelect.firstChild) datalistSelect.removeChild(datalistSelect.firstChild);
  responseData.forEach(data => {
    // If data doesn't contain a city name, disregard it
    if (data.address.city) {
      // Clean up data and edit into 'city, country' format
      const cityName = data.address.city.toUpperCase();
      const countryName = data.address.country.toUpperCase();
      // Add matching, non-duplicate values to datalist
      if (
        cityName.indexOf(inputValue) !== -1 &&
        duplicatePreventer.indexOf(countryName) === -1
      ) {
        const fullPlacename = `${cityName}, ${countryName}`;
        // Create new <option> element
        const option = document.createElement('option');
        option.className = 'locationOption';
        option.id = data.locationId;
        option.value = fullPlacename;
        option.innerText = fullPlacename;
        // Add the <option> element to the <datalist>
        datalistSelect.appendChild(option);
        // Add country to array so same city isn't shown twice
        duplicatePreventer.push(countryName);
        // Add location ID to locationIdArray
        locationIdArray.push(data.locationId);
      }
    }
  });
};

const fetchWeather = function fetchWeatherFromOpenWeatherMapAPI(latitude, longitude) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OWMAPIKey}`
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
};

const getWeather = function getWeatherInfoAndDisplay(data) {
  getWeatherIcon(data);
  displayWeatherIcon();
  displayTemp(data);
  displayWeatherDetails(data);
  displayCityName();
  getCurrentDate();
  displayCurrentDate();
  toggleBackgroundImg();
};

const getWeatherIcon = function getCityWeatherIcon(data) {
  // Get weather type ID from API and show corresponding font awesome icon
  switch (true) {
    // Thunderstorms
    case data.weather['0'].id > 199 && data.weather['0'].id < 233:
      weatherIcon = 'img/storm-icon.png';
      break;
    // Drizzle
    case data.weather['0'].id > 299 && data.weather['0'].id < 322:
      weatherIcon = 'img/light-rain-icon.png';
      break;
    // Light rain
    case data.weather['0'].id === 500 ||
      data.weather['0'].id === 520 ||
      data.weather['0'].id === 521:
      weatherIcon = 'img/light-rain-icon.png';
      break;
    // Moderate to heavy rain
    case (data.weather['0'].id > 500 && data.weather['0'].id < 512) ||
      (data.weather['0'].id > 521 && data.weather['0'].id < 532):
      weatherIcon = 'img/heavy-rain-icon.png';
      break;
    // Sleet
    //TODO: Create sleet icon
    case data.weather['0'].id > 610 && data.weather['0'].id < 617:
      weatherIcon = 'img/snow-icon.png';
      break;
    // Snow
    case (data.weather['0'].id > 599 && data.weather['0'].id < 603) ||
      (data.weather['0'].id > 619 && data.weather['0'].id < 623):
      weatherIcon = 'img/snow-icon.png';
      break;
    // Atmosphere
    //TODO: Create fog icon
    case data.weather['0'].id > 699 && data.weather['0'].id < 782:
      weatherIcon = 'img/snow-icon.png';
      break;
    // Light clouds
    case data.weather['0'].id === 801 || data.weather['0'].id === 802:
      weatherIcon = 'img/light-cloud-icon.png';
      break;
    // Heavy clouds
    case data.weather['0'].id === 803 || data.weather['0'].id === 804:
      weatherIcon = 'img/heavy-cloud-icon.png';
      break;
    // Else, clear
    default:
      weatherIcon = 'img/sunny-icon.png';
      break;
  }
};

const displayWeatherIcon = function displayMatchingWeatherIcon() {
  const weatherIconImage = document.createElement('img');
  weatherIconImage.setAttribute('src', `${weatherIcon}`);
  tempIconContainer.appendChild(weatherIconImage);
};

const getCurrentDate = function getCurrentDateFromUser() {
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  currentDate = `${new Date().toLocaleTimeString('en-GB', options)}`;
};

const displayCurrentDate = function displayCurrentDateFromUser() {
  const dateBox = document.createElement('p');
  const dateBoxText = document.createTextNode(`${currentDate}`);
  dateBox.appendChild(dateBoxText);
  dateBox.classList.add(
    'is-size-6',
    'is-size-7-mobile',
    'has-text-white',
    'has-text-weight-normal',
    'is-marginless'
  );
  weatherDataContainer.appendChild(dateBox);
};

const displayTemp = function displayCurrentTemperature(data) {
  currentTemp = data.main.temp;
  const tempTextBox = document.createElement('h1');
  const tempText = document.createTextNode(`${Math.round(data.main.temp)}°C`);

  tempTextBox.appendChild(tempText);
  if (tempText.length > 4) {
    tempTextBox.classList.add(
      'is-size-2',
      'has-text-white',
      'has-text-weight-semibold',
      'is-marginless'
    );
  } else {
    tempTextBox.classList.add(
      'is-size-1',
      'is-size-2-mobile',
      'has-text-white',
      'has-text-weight-semibold',
      'is-marginless'
    );
  }
  weatherDataContainer.appendChild(tempTextBox);
};

const displayWeatherDetails = function displayWeatherTypeDetails(data) {
  const weatherInfoBox = document.createElement('p');
  const weatherInfoText = document.createTextNode(`${data.weather['0'].description}`);
  weatherInfoBox.appendChild(weatherInfoText);
  weatherInfoBox.classList.add(
    'is-size-4',
    'is-size-5-mobile',
    'has-text-white',
    'has-text-weight-semibold',
    'is-marginless'
  );
  weatherDataContainer.appendChild(weatherInfoBox);
};

const displayCityName = function displaySelectedCityName() {
  const cityNameBox = document.createElement('p');
  const cityNameBoxText = document.createTextNode(`${selectedCity}`);
  cityNameBox.appendChild(cityNameBoxText);
  cityNameBox.classList.add(
    'is-size-6',
    'is-size-7-mobile',
    'has-text-white',
    'has-text-weight-normal',
    'is-marginless'
  );
  weatherDataContainer.appendChild(cityNameBox);
};

const toggleBackgroundImg = function toggleBackgroundImage() {
  if (currentTemp < 30) {
    resultPage.classList.remove('has-background-default');
    resultPage.classList.add('has-background-day-cool');
    currentBackground = 'has-background-day-cool';
  }
  if (currentTemp > 30) {
    resultPage.classList.remove('has-background-default');
    resultPage.classList.add('has-background-day-warm');
    resultPage = 'has-background-day-warm';
  }
  if (
    weatherIcon === 'img/snow-icon.png'
  ) {
    resultPage.classList.remove('has-background-default');
    resultPage.classList.add('has-background-snow-mist');
    currentBackground = 'has-background-snow-mist';
  }
  if (
    weatherIcon === 'img/heavy-rain-icon.png' ||
    weatherIcon === 'img/storm-icon.png'
  ) {
    resultPage.classList.remove('has-background-default');
    resultPage.classList.add('has-background-dark');
    currentBackground = 'has-background-dark';
  }
};

const onReturnButtonPress = function onReturnButtonPressResetValues() {
  // Remove data elements generated during previous search
  while (tempIconContainer.firstChild) {
    tempIconContainer.removeChild(tempIconContainer.firstChild);
  }
  while (weatherDataContainer.firstChild) {
    weatherDataContainer.removeChild(weatherDataContainer.firstChild);
  }
  while (datalistSelect.firstChild) {
    datalistSelect.removeChild(datalistSelect.firstChild)
  }
  inputField.value = '';
  resultPage.classList.remove(`${currentBackground}`);
  resultPage.classList.add('has-background-default');
  inputPage.classList.toggle('is-hidden');
  resultPage.classList.toggle('is-hidden');
  inputField.focus();
  currentTemp = '';
};
