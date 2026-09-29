import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiCloud, FiCloudRain, FiCloudSnow, FiWind, FiDroplet, FiMapPin, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

const getCondition = (code) => {
  if (code === 0) return { label: 'Clear Sky', icon: 'sunny' };
  if (code <= 2) return { label: 'Partly Cloudy', icon: 'cloudy' };
  if (code === 3) return { label: 'Overcast', icon: 'cloudy' };
  if (code <= 49) return { label: 'Foggy', icon: 'cloudy' };
  if (code <= 59) return { label: 'Drizzle', icon: 'rainy' };
  if (code <= 69) return { label: 'Rain', icon: 'rainy' };
  if (code <= 79) return { label: 'Snow', icon: 'snowy' };
  if (code <= 82) return { label: 'Rain Showers', icon: 'rainy' };
  if (code <= 86) return { label: 'Snow Showers', icon: 'snowy' };
  if (code <= 99) return { label: 'Thunderstorm', icon: 'rainy' };
  return { label: 'Clear', icon: 'sunny' };
};

const bgMap = {
  sunny: 'from-orange-400 to-yellow-500',
  cloudy: 'from-slate-400 to-slate-600',
  rainy: 'from-blue-500 to-indigo-700',
  snowy: 'from-blue-200 to-blue-400',
};

const iconEl = {
  sunny: <FiSun className="w-12 h-12 text-yellow-300" />,
  cloudy: <FiCloud className="w-12 h-12 text-gray-200" />,
  rainy: <FiCloudRain className="w-12 h-12 text-blue-200" />,
  snowy: <FiCloudSnow className="w-12 h-12 text-blue-100" />,
};

const fetchOpenMeteo = async (lat, lon) => {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`
  );
  const data = await res.json();
  const c = data.current;
  const cond = getCondition(c.weather_code);
  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    wind: Math.round(c.wind_speed_10m),
    ...cond,
  };
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setWeather(null);

    try {
      // Step 1: Get location via IP (always works, no permission needed)
      const ipRes = await fetch('https://ipwho.is/');
      const ipData = await ipRes.json();

      if (!ipData.success) throw new Error('IP lookup failed');

      const { latitude, longitude, city: ipCity, country_code } = ipData;
      setCity(`${ipCity}, ${country_code}`);

      // Step 2: Try to get more accurate GPS location in background
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude: gLat, longitude: gLon } = pos.coords;
              // Reverse geocode with GPS coords
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${gLat}&lon=${gLon}&format=json`,
                { headers: { 'Accept-Language': 'en' } }
              );
              const geoData = await geoRes.json();
              const addr = geoData.address || {};
              const gpsCity = addr.city || addr.town || addr.village || addr.county || ipCity;
              setCity(`${gpsCity}, ${(addr.country_code || country_code || '').toUpperCase()}`);
              // Refresh weather with GPS coords
              const w = await fetchOpenMeteo(gLat, gLon);
              setWeather(w);
            } catch {
              // Keep IP-based weather, ignore GPS error
            }
          },
          () => {} // Silently ignore GPS denial
        );
      }

      // Step 3: Fetch weather with IP coords immediately
      const w = await fetchOpenMeteo(latitude, longitude);
      setWeather(w);
    } catch (err) {
      setError('Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${weather ? bgMap[weather.icon] : 'from-blue-400 to-blue-600'} p-5 rounded-xl shadow-lg text-white`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest opacity-75">Weather</span>
        <button onClick={load} disabled={loading} className="opacity-60 hover:opacity-100 transition-opacity">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center py-4 gap-2 text-center">
          <FiAlertCircle className="w-8 h-8 opacity-70" />
          <p className="text-sm opacity-80">{error}</p>
          <button onClick={load} className="text-xs underline opacity-70 hover:opacity-100">Retry</button>
        </div>
      )}

      {weather && !loading && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-bold leading-none">{weather.temp}°C</div>
              <div className="text-sm opacity-80 mt-1">{weather.label}</div>
              {city && (
                <div className="flex items-center gap-1 mt-1.5 opacity-70 text-xs">
                  <FiMapPin className="w-3 h-3" />
                  <span>{city}</span>
                </div>
              )}
            </div>
            {iconEl[weather.icon]}
          </div>

          <div className="grid grid-cols-3 gap-1 mt-4 pt-3 border-t border-white/20 text-center text-xs">
            <div>
              <FiDroplet className="w-3.5 h-3.5 mx-auto mb-0.5 opacity-70" />
              <div className="opacity-60">Humidity</div>
              <div className="font-semibold">{weather.humidity}%</div>
            </div>
            <div>
              <FiWind className="w-3.5 h-3.5 mx-auto mb-0.5 opacity-70" />
              <div className="opacity-60">Wind</div>
              <div className="font-semibold">{weather.wind} km/h</div>
            </div>
            <div>
              <FiSun className="w-3.5 h-3.5 mx-auto mb-0.5 opacity-70" />
              <div className="opacity-60">Feels Like</div>
              <div className="font-semibold">{weather.feelsLike}°C</div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default WeatherWidget;
