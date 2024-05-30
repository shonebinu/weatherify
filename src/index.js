import "./styles.css";
import { parseISO, format } from "date-fns";
import WeatherAPI from "./weatherAPI";

let debounceTimer;
const unit = document.querySelector(".unit");
const location = document.querySelector(".location");
const locationInput = location.querySelector("input");
const loadingElement = document.querySelector(".loading");
const autoComplete = document.querySelector(".auto-complete");

if (!localStorage.getItem("location")) {
	const ipData = await WeatherAPI.getIP();
	const currLocation = `${ipData.city}, ${ipData.region}`;
	ipData.region + localStorage.setItem("location", currLocation);
}

if (!localStorage.getItem("isCelsius")) {
	localStorage.setItem("isCelsius", true);
}

updateUI();

unit.addEventListener("click", () => {
	const isCelsius = localStorage.getItem("isCelsius") === "true";
	localStorage.setItem("isCelsius", isCelsius ? false : true);
	updateUI();
});

location.querySelector("button").addEventListener("click", async () => {
	loadingElement.style.display = "flex";
	const trueLocation = await WeatherAPI.getForeCastWeather(locationInput.value);
	if (trueLocation.location) {
		localStorage.setItem(
			"location",
			`${trueLocation.location.name}, ${trueLocation.location.region}`,
		);
	}
	autoComplete.innerHTML = "";
	updateUI();
});

location.querySelector("input").addEventListener("keydown", (e) => {
	clearTimeout(debounceTimer);

	debounceTimer = setTimeout(() => {
		if (e.key === "Enter") {
			e.preventDefault();
			location.querySelector("button").click();
		}

		updateAutosuggestions();
	}, 300);
});

async function updateAutosuggestions() {
	const value = locationInput.value;

	autoComplete.innerHTML = "";

	if (!value) {
		return;
	}

	const locationSuggestions = await WeatherAPI.getLocations(value);

	if (locationSuggestions.length > 3) {
		locationSuggestions.splice(3);
	}

	for (const location of locationSuggestions) {
		autoComplete.innerHTML += `
			<div>
				<p>${location.name}</p>
				<p>${location.region}, ${location.country}</p>
			</div>
		`;
	}

	for (const elem of autoComplete.querySelectorAll("div")) {
		elem.addEventListener("click", async () => {
			const locationName = elem.querySelector("p:first-child").textContent;
			const region = elem
				.querySelector("p:last-child")
				.textContent.split(",")[0];
			locationInput.value = `${locationName}, ${region}`;
			location.querySelector("button").click();
		});
	}
}

function formatDate(dateString) {
	const date = parseISO(dateString);
	const dayFormatString = "EEEE";
	const dateFormatString = "dd MMMM yyyy";
	const dayOfWeek = format(date, dayFormatString);
	const formattedDate = format(date, dateFormatString);
	return `<strong>${dayOfWeek},</strong> ${formattedDate}`;
}

function formatHour(dateString) {
	const date = parseISO(dateString);
	const hour = format(date, "h");
	const period = format(date, "a");
	return `${hour} ${period.toUpperCase()}`;
}

async function updateUI() {
	const location = localStorage.getItem("location");
	const isCelsius = localStorage.getItem("isCelsius") === "true";

	updateTopBar(location, isCelsius); // since the data is already available, update first

	const historyData = await WeatherAPI.getHistoryWeather(location, 1);
	const forecastData = await WeatherAPI.getForeCastWeather(location, 3);

	updateTodayBar(forecastData, isCelsius);
	updateHourlyBar(forecastData.forecast.forecastday[0].hour);

	updateWeekBar(
		[
			historyData.forecast.forecastday[0],
			forecastData.forecast.forecastday[1],
			forecastData.forecast.forecastday[2],
		],
		isCelsius,
	);

	setTimeout(() => {
		loadingElement.style.display = "none"; // Hide the loading spinner
		autoComplete.innerHTML = "";
	}, 300);
}

function updateTopBar(location, celsius) {
	const section = document.querySelector(".top-bar");
	const unitSpan = section.querySelector(".unit > span");

	unitSpan.textContent = celsius ? "C" : "F";
	locationInput.value = location;
}

function updateTodayBar(data, isCelsius) {
	const section = document.querySelector(".main-container");
	const currStateImg = section.querySelector(".state");
	const currTemp = section.querySelector(".temp > span");
	const brief = section.querySelector(".today-highlight .brief");
	const feelsLike = section.querySelector(".feels-like > span");
	const date = section.querySelector(".date");
	const minTemp = section.querySelector(".min-temp");
	const maxTemp = section.querySelector(".max-temp");
	const rainChance = section.querySelector(".rain-chance");
	const humidity = section.querySelector(".humidity");
	const sunrise = section.querySelector(".sunrise");
	const sunset = section.querySelector(".sunset");

	currStateImg.src = data.current.condition.icon;
	currTemp.textContent = isCelsius ? data.current.temp_c : data.current.temp_f;
	brief.textContent = data.current.condition.text;
	feelsLike.textContent = isCelsius
		? data.current.feelslike_c
		: data.current.feelslike_f;
	date.innerHTML = formatDate(data.forecast.forecastday[0].date);
	minTemp.textContent = isCelsius
		? data.forecast.forecastday[0].day.mintemp_c
		: data.forecast.forecastday[0].day.mintemp_f;
	maxTemp.textContent = isCelsius
		? data.forecast.forecastday[0].day.maxtemp_c
		: data.forecast.forecastday[0].day.maxtemp_f;
	rainChance.textContent =
		data.forecast.forecastday[0].day.daily_chance_of_rain;
	humidity.textContent = data.current.humidity;
	sunrise.textContent = data.forecast.forecastday[0].astro.sunrise;
	sunset.textContent = data.forecast.forecastday[0].astro.sunset;
}

function updateHourlyBar(data) {
	const section = document.querySelector(".hourly");
	section.innerHTML = "";

	for (let j = 0, i = 3; j < 6; j++, i = (i + 4) % 24) {
		const time = formatHour(data[i].time);
		const img = data[i].condition.icon;
		const condition = data[i].condition.text;

		const hourDiv = document.createElement("div");
		hourDiv.classList.add("hour");

		hourDiv.innerHTML = `
            <p>${time}</p>
            <img src="${img}">
            <p>${condition}</p>
        `;

		section.appendChild(hourDiv);
	}
}

function updateWeekBar(data, isCelsius) {
	const section = document.querySelector(".week");
	const daily = section.querySelectorAll(".daily");

	updateDayCard(data[0], isCelsius, daily[0]);
	updateDayCard(data[1], isCelsius, daily[1]);
	updateDayCard(data[2], isCelsius, daily[2]);
}

function updateDayCard(data, isCelsius, elem) {
	const img = elem.querySelector("img");
	const temp = elem.querySelector(".temp > span");
	const brief = elem.querySelector(".brief");
	const date = elem.querySelector(".date");
	const rainChance = elem.querySelector(".rain-chance");
	const humidity = elem.querySelector(".humidity");
	const sunrise = elem.querySelector(".sunrise");
	const sunset = elem.querySelector(".sunset");

	img.src = data.day.condition.icon;
	temp.textContent = isCelsius ? data.day.avgtemp_c : data.day.avgtemp_f;
	brief.textContent = data.day.condition.text;
	date.innerHTML = formatDate(data.date);
	rainChance.textContent = data.day.daily_chance_of_rain;
	humidity.textContent = data.day.avghumidity;
	sunrise.textContent = data.astro.sunrise;
	sunset.textContent = data.astro.sunset;
}
