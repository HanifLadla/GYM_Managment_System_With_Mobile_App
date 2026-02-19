import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiCloud, FiCloudRain, FiThermometer } from 'react-icons/fi';

const WeatherWidget = () => {
  const [weather, setWeather] = useState({
    temperature: 28,
    condition: 'sunny',
    humidity: 65,
    location: 'Karachi, Pakistan'
  });

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return FiSun;
      case 'cloudy': return FiCloud;
      case 'rainy': return FiCloudRain;
      default: return FiSun;
    }
  };

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-xl shadow-lg text-white"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Weather</h3>
          <p className="text-blue-100 text-sm">{weather.location}</p>
        </div>
        <WeatherIcon className="w-8 h-8 text-yellow-300" />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">{weather.temperature}°C</div>
          <div className="text-blue-100 text-sm capitalize">{weather.condition}</div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-blue-100">
            <FiThermometer className="w-4 h-4" />
            <span className="text-sm">{weather.humidity}% humidity</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;