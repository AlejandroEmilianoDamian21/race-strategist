export interface WeatherSegment {
  fromLap: number;
  toLap: number;
  temperature: number;
  rainIntensity: number;
}

export interface WeatherForecast {
  raceId: string;
  summary: string;
  forecast: WeatherSegment[];
}
