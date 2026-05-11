/*************************************************
 * GLOBAL STATE
 *************************************************/
const appState = {
  countryCode: "",
  countryName: "",
  capital: "",
  year: new Date().getFullYear(),
  plans: JSON.parse(localStorage.getItem("plans")) || []
};

const WEATHER_API_KEY = "550622e0df831a1b2202bb4183467562";
const HOLIDAY_API_KEY = "Tyny0w2ICAZBBYbVUo1Dj2Gunm6BPTRW";

/*************************************************
 * NAVIGATION
 *************************************************/
const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");

function navigateTo(view) {
  views.forEach(v => v.classList.remove("active"));
  document.getElementById(`${view}-view`)?.classList.add("active");

  navItems.forEach(i => i.classList.remove("active"));
  document.querySelector(`[data-view="${view}"]`)?.classList.add("active");

  document.getElementById("page-title").textContent =
    view.replace("-", " ").toUpperCase();
}

navItems.forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    navigateTo(item.dataset.view);
  });
});

/*************************************************
 * DOM ELEMENTS
 *************************************************/
const countrySelect = document.getElementById("global-country");
const citySelect = document.getElementById("global-city");
const yearSelect = document.getElementById("global-year");
const exploreBtn = document.getElementById("global-search-btn");

const dashboardInfo = document.getElementById("dashboard-country-info");

/*************************************************
 * LOAD YEARS
 *************************************************/
function loadYears() {
  yearSelect.innerHTML = "";
  const y = new Date().getFullYear();
  for (let i = y; i <= y + 5; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    yearSelect.appendChild(opt);
  }
  yearSelect.value = appState.year;
}

/*************************************************
 * LOAD COUNTRIES + CAPITALS
 *************************************************/
async function loadCountries() {
  const res = await fetch(
    "https://restcountries.com/v3.1/all?fields=name,cca2,capital,flags"
  );
  const countries = await res.json();

  countries.sort((a, b) =>
    a.name.common.localeCompare(b.name.common)
  );

  countrySelect.innerHTML = `<option value="">Select Country</option>`;

  countries.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.cca2;
    opt.textContent = c.name.common;
    opt.dataset.capital = c.capital?.[0] || "";
    opt.dataset.flag = c.flags?.png || "";
    countrySelect.appendChild(opt);
  });
}

/*************************************************
 * COUNTRY CHANGE
 *************************************************/
countrySelect.addEventListener("change", () => {
  const opt = countrySelect.selectedOptions[0];
  appState.countryCode = opt.value;
  appState.countryName = opt.textContent;
  appState.capital = opt.dataset.capital;

  citySelect.innerHTML = "";
  if (appState.capital) {
    const c = document.createElement("option");
    c.value = appState.capital;
    c.textContent = appState.capital;
    citySelect.appendChild(c);
  }
});

/*************************************************
EXPLORE BUTTON
 *************************************************/
exploreBtn.addEventListener("click", () => {
  if (!appState.countryCode) {
    Swal.fire("Select a country first 🌍");
    return;
  }

  renderCountryInfo();
  loadWeather();
  loadHolidays();
loadWeatherView();

  navigateTo("holidays");
});
exploreBtn.addEventListener("click", () => {
  loadCountryDetails();      // Dashboard
  loadWeatherView();        // Weather
  loadSunTimesView();       // Sun Times
  loadEventsView();         // Events
  loadLongWeekendsView();   // Long Weekends
});

/*************************************************
 * COUNTRY INFO (DASHBOARD)
 *************************************************/
function renderCountryInfo() {
  dashboardInfo.innerHTML = `
    <div class="info-card">
      <h3>${appState.countryName}</h3>
      <p><strong>Capital:</strong> ${appState.capital}</p>
      <p><strong>Year:</strong> ${yearSelect.value}</p>
    </div>
  `;
}

/*************************************************
 * WEATHER
 *************************************************/
async function loadWeather() {
  const city = appState.capital;
  if (!city) return;

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`
  );
  const data = await res.json();

  document.getElementById("weather-content").innerHTML = `
    <div class="weather-card">
      <h3>${data.name}</h3>
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png">
      <p>${Math.round(data.main.temp)}°C</p>
      <p>${data.weather[0].description}</p>
      <button onclick="savePlan('weather','${data.name}')">❤️ Save</button>
    </div>
  `;
  async function loadWeatherView() {
  const city = appState.capital;
  if (!city) return;

  
  const geoRes = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${WEATHER_API_KEY}`
  );
  const geo = await geoRes.json();

  const { lat, lon } = geo[0];
  appState.lat = lat;
  appState.lon = lon;

  const res = await fetch(
    `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
  );
  const data = await res.json();

  /* Top orange card */
  document.getElementById("weather-main").innerHTML = `
    <h2>${Math.round(data.current.temp)}°C</h2>
    <p>${data.current.weather[0].description}</p>
  `;

  /* Small cards */
  document.getElementById("weather-stats").innerHTML = `
    <div>Humidity: ${data.current.humidity}%</div>
    <div>Wind: ${data.current.wind_speed} km/h</div>
    <div>UV Index: ${data.current.uvi}</div>
    <div>Rain: ${data.daily[0].pop * 100}%</div>
  `;

  /* 7 Days */
  document.getElementById("weather-7days").innerHTML =
    data.daily.slice(0, 7).map(d => `
      <div class="day-card">
        <p>${new Date(d.dt * 1000).toDateString()}</p>
        <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png">
        <strong>${Math.round(d.temp.day)}°</strong>
      </div>
    `).join("");
}

}
/**********************EVENTS************************ */

async function loadSunTimesView() {
  const res = await fetch(
    `https://api.sunrise-sunset.org/json?lat=${appState.lat}&lng=${appState.lon}&formatted=0`
  );
  const data = await res.json();

  document.getElementById("sun-times-content").innerHTML = `
    <div class="sun-card">
      🌅 Sunrise: ${new Date(data.results.sunrise).toLocaleTimeString()}
    </div>
    <div class="sun-card">
      🌇 Sunset: ${new Date(data.results.sunset).toLocaleTimeString()}
    </div>
    <div class="sun-card">
      🕛 Day Length: ${data.results.day_length}
    </div>
  `;
}
/********************long holidays******************* */

async function loadLongWeekendsView() {
  const res = await fetch(
    `https://calendarific.com/api/v2/holidays?api_key=${HOLIDAY_API_KEY}&country=${appState.countryCode}&year=${yearSelect.value}`
  );
  const data = await res.json();

  const holidays = data.response.holidays.filter(
    h => h.type.includes("National holiday")
  );

  document.getElementById("long-weekends-content").innerHTML =
    holidays.slice(0, 6).map(h => `
      <div class="holiday-card">
        <h4>${h.name}</h4>
        <p>${h.date.iso}</p>
      </div>
    `).join("");
}

/*************************************************
 * HOLIDAYS
 *************************************************/
async function loadHolidays() {
  const res = await fetch(
    `https://calendarific.com/api/v2/holidays?api_key=${HOLIDAY_API_KEY}&country=${appState.countryCode}&year=${yearSelect.value}`
  );
  const data = await res.json();

  const holidays = data.response.holidays.slice(0, 10);

  document.getElementById("holidays-content").innerHTML =
    holidays.map(h => `
      <div class="holiday-card">
        <h4>${h.name}</h4>
        <p>${h.date.iso}</p>
        <button onclick="savePlan('holiday','${h.name}')">❤️ Save</button>
      </div>
    `).join("");
}

/*************************************************
 * SAVE TO LOCAL STORAGE
 *************************************************/
function savePlan(type, title) {
  appState.plans.push({ type, title });
  localStorage.setItem("plans", JSON.stringify(appState.plans));
  updatePlans();
  Swal.fire("Saved ❤️");
}

/*************************************************
 * MY PLANS
 *************************************************/
function updatePlans() {
  const box = document.getElementById("plans-content");
  if (!appState.plans.length) {
    box.innerHTML = "<p>No saved plans yet</p>";
    return;
  }

  box.innerHTML = appState.plans.map(p => `
    <div class="plan-card">
      <strong>${p.type.toUpperCase()}</strong>
      <p>${p.title}</p>
    </div>
  `).join("");
}


/*************************************************
 * INIT
 *************************************************/
loadYears();
loadCountries();
updatePlans();

console.log("Wanderlust App Ready");
