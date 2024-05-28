import "./styles.css";
import WeatherAPI from "./weatherAPI";

WeatherAPI.getForeCastWeather("kochi").then(console.log);
