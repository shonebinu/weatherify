const { subDays, format } = require("date-fns");

const WeatherAPI = (() => {
	const BASE_URL = "https://api.weatherapi.com/v1/";
	const API_KEY = "3d9c4db84ef34bb7aba142125242605";

	async function fetchData(url) {
		try {
			const response = await fetch(url, {
				mode: "cors",
			});
			const data = await response.json();
			return data;
		} catch (err) {
			console.error("There was a problem with the fetch operation: ", err);
			throw err;
		}
	}

	function getIP() {
		const IP_LOOKUP = `${BASE_URL}ip.json?key=${API_KEY}&q=auto:ip`;
		return fetchData(IP_LOOKUP);
	}

	function getForeCastWeather(query, days = 1) {
		const FORECASE_WEATHER = `${BASE_URL}forecast.json?key=${API_KEY}&q=${query}&days=${days}`;
		return fetchData(FORECASE_WEATHER);
	}

	function getHistoryWeather(query, days = 1) {
		const date = subDays(new Date(), days);
		const stringDate = format(date, "yyyy-MM-dd");

		const HISTORY_WEATHER = `${BASE_URL}history.json?key=${API_KEY}&q=${query}&dt=${stringDate}`;
		return fetchData(HISTORY_WEATHER);
	}

	function getLocations(query) {
		const LOCATIONS = `${BASE_URL}search.json?key=${API_KEY}&q=${query}`;
		return fetchData(LOCATIONS);
	}

	return {
		getIP,
		getForeCastWeather,
		getHistoryWeather,
		getLocations,
	};
})();

export default WeatherAPI;
