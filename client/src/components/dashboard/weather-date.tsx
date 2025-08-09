import { Card, CardContent } from "@/components/ui/card";
import { Cloud, Sun, CloudRain, CloudSnow, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

export function WeatherDate() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Mock weather data (in a real app, this would come from a weather API)
  const getWeatherData = () => {
    const conditions = ['sunny', 'cloudy', 'rainy', 'snowy'];
    const temperatures = [18, 22, 15, 8];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = temperatures[Math.floor(Math.random() * temperatures.length)];
    
    return {
      condition,
      temperature: temp,
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      description: {
        sunny: 'Sunny',
        cloudy: 'Partly Cloudy', 
        rainy: 'Light Rain',
        snowy: 'Snow Showers'
      }[condition]
    };
  };

  const weather = getWeatherData();

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return Sun;
      case 'cloudy': return Cloud;
      case 'rainy': return CloudRain;
      case 'snowy': return CloudSnow;
      default: return Sun;
    }
  };

  const getWeatherColor = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'text-yellow-500';
      case 'cloudy': return 'text-gray-500';
      case 'rainy': return 'text-blue-500';
      case 'snowy': return 'text-blue-300';
      default: return 'text-yellow-500';
    }
  };

  const WeatherIcon = getWeatherIcon(weather.condition);
  const iconColor = getWeatherColor(weather.condition);

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Date and Time */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <h2 className="text-2xl font-bold">
              {format(currentTime, 'EEEE, MMM d')}
            </h2>
            <p className="text-blue-100 text-sm">
              {format(currentTime, 'h:mm a')}
            </p>
          </div>

          {/* Weather Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <WeatherIcon className={`w-7 h-7 ${iconColor}`} />
              </div>
              <div>
                <p className="font-medium">{weather.description}</p>
                <p className="text-blue-100 text-sm">Humidity {weather.humidity}%</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{weather.temperature}°C</div>
            </div>
          </div>

          {/* Event Planning Tip */}
          <div className="pt-4 border-t border-white/20">
            <p className="text-xs text-blue-100">
              {weather.condition === 'rainy' ? 
                '🌂 Consider indoor alternatives for outdoor events' :
                weather.condition === 'sunny' ?
                '☀️ Perfect weather for outdoor events' :
                '🌤️ Great weather for any event type'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}