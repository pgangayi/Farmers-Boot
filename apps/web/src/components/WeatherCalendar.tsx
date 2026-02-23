/**
 * WEATHER CALENDAR COMPONENT
 * ==========================
 * Calendar view for weather data with agricultural planning features
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Thermometer,
  Wind,
  Calendar as CalendarIcon,
  SunMedium,
  CloudSun,
  Umbrella,
  AlertTriangle,
  Plus,
  MapPin,
} from 'lucide-react';

interface WeatherCalendarProps {
  farmId?: string;
  className?: string;
  onDateSelect?: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  weather?: {
    condition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy';
    temp_max: number;
    temp_min: number;
    precipitation: number;
    humidity: number;
  };
  events?: CalendarEvent[];
}

interface CalendarEvent {
  id: string;
  type: 'planting' | 'harvest' | 'irrigation' | 'spraying' | 'other';
  title: string;
  time?: string;
}

// Weather condition icons
const WEATHER_ICONS: Record<string, React.ReactNode> = {
  sunny: <Sun className="w-4 h-4 text-yellow-500" />,
  partly_cloudy: <CloudSun className="w-4 h-4 text-blue-400" />,
  cloudy: <Cloud className="w-4 h-4 text-gray-500" />,
  rainy: <CloudRain className="w-4 h-4 text-blue-600" />,
  stormy: <Umbrella className="w-4 h-4 text-purple-600" />,
};

// Default weather icon
const DEFAULT_WEATHER_ICON = <Cloud className="w-4 h-4 text-gray-500" />;

// Helper function to safely get weather icon
const getWeatherIcon = (condition: string): React.ReactNode => {
  return WEATHER_ICONS[condition] || DEFAULT_WEATHER_ICON;
};

// Event type colors
const EVENT_COLORS: Record<string, string> = {
  planting: 'bg-green-500',
  harvest: 'bg-amber-500',
  irrigation: 'bg-blue-500',
  spraying: 'bg-red-500',
  other: 'bg-gray-500',
};

// Default event color
const DEFAULT_EVENT_COLOR = 'bg-gray-500';

// Helper function to safely get event color
const getEventColor = (type: string): string => {
  return EVENT_COLORS[type] || DEFAULT_EVENT_COLOR;
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generate calendar data for a month
const generateCalendarData = (year: number, month: number): CalendarDay[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy';
  const conditions: WeatherCondition[] = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'stormy'];

  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday = currentDate.getTime() === today.getTime();

    // Generate weather for current and future dates
    const weather =
      isCurrentMonth || currentDate > today
        ? {
            condition: conditions[Math.floor(Math.random() * conditions.length)] || 'sunny',
            temp_max: 25 + Math.floor(Math.random() * 10),
            temp_min: 15 + Math.floor(Math.random() * 5),
            precipitation: Math.floor(Math.random() * 30),
            humidity: 40 + Math.floor(Math.random() * 40),
          }
        : undefined;

    // Add sample events
    const events: CalendarEvent[] = [];
    if (isCurrentMonth) {
      if (currentDate.getDate() === 5) {
        events.push({ id: '1', type: 'planting', title: 'Plant Maize', time: '08:00' });
      }
      if (currentDate.getDate() === 12) {
        events.push({ id: '2', type: 'irrigation', title: 'Irrigate Field A', time: '06:00' });
      }
      if (currentDate.getDate() === 15) {
        events.push({ id: '3', type: 'spraying', title: 'Pest Control', time: '10:00' });
      }
      if (currentDate.getDate() === 20) {
        events.push({ id: '4', type: 'harvest', title: 'Harvest Tomatoes', time: '07:00' });
      }
      if (currentDate.getDate() === 25) {
        events.push({ id: '5', type: 'planting', title: 'Plant Beans', time: '09:00' });
      }
    }

    days.push({
      date: currentDate,
      isCurrentMonth,
      isToday,
      weather,
      events: events.length > 0 ? events : undefined,
    });
  }

  return days;
};

export function WeatherCalendar({ farmId, className = '', onDateSelect }: WeatherCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => generateCalendarData(year, month), [year, month]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    onDateSelect?.(day.date);
  };

  // Get selected day details
  const selectedDayData = selectedDate
    ? calendarDays.find(d => d.date.toDateString() === selectedDate.toDateString())
    : null;

  // Calculate month statistics
  const monthStats = useMemo(() => {
    const monthDays = calendarDays.filter(d => d.isCurrentMonth && d.weather);
    const avgTemp =
      monthDays.reduce((sum, d) => sum + (d.weather!.temp_max + d.weather!.temp_min) / 2, 0) /
      monthDays.length;
    const totalRain = monthDays.reduce((sum, d) => sum + d.weather!.precipitation, 0);
    const rainyDays = monthDays.filter(d => d.weather!.precipitation > 5).length;

    return { avgTemp, totalRain, rainyDays };
  }, [calendarDays]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Weather Calendar
          </h2>
          <p className="text-gray-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            Agricultural planning with weather forecasts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
          </div>
        </div>
      </div>

      {/* Month Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Temperature</p>
                <p className="text-xl font-bold text-gray-900">
                  {monthStats.avgTemp?.toFixed(1) || '--'}°C
                </p>
              </div>
              <Thermometer className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expected Rainfall</p>
                <p className="text-xl font-bold text-gray-900">
                  {monthStats.totalRain?.toFixed(0) || '--'} mm
                </p>
              </div>
              <CloudRain className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rainy Days</p>
                <p className="text-xl font-bold text-gray-900">{monthStats.rainyDays || 0} days</p>
              </div>
              <Umbrella className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {MONTHS[month]} {year}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[80px] p-1 rounded-lg text-left transition-colors ${
                    !day.isCurrentMonth
                      ? 'bg-gray-50 text-gray-400'
                      : selectedDate?.toDateString() === day.date.toDateString()
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : day.isToday
                          ? 'bg-green-50 border border-green-300'
                          : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-medium ${day.isToday ? 'text-green-600' : ''}`}>
                      {day.date.getDate()}
                    </span>
                    {day.weather && day.isCurrentMonth && (
                      <span>{WEATHER_ICONS[day.weather.condition]}</span>
                    )}
                  </div>
                  {day.weather && day.isCurrentMonth && (
                    <div className="text-xs text-gray-500 mt-1">
                      <div>
                        {day.weather.temp_max}°/{day.weather.temp_min}°
                      </div>
                      {day.weather.precipitation > 0 && (
                        <div className="text-blue-500">{day.weather.precipitation}mm</div>
                      )}
                    </div>
                  )}
                  {day.events && day.events.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {day.events.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded truncate text-white ${EVENT_COLORS[event.type]}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 2 && (
                        <div className="text-xs text-gray-500">+{day.events.length - 2} more</div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-green-500"></span>
                  <span>Planting</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  <span>Harvest</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-blue-500"></span>
                  <span>Irrigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500"></span>
                  <span>Spraying</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select a Day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayData ? (
              <div className="space-y-4">
                {/* Weather Details */}
                {selectedDayData.weather && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-white rounded-lg">
                        {WEATHER_ICONS[selectedDayData.weather.condition]}
                      </div>
                      <div>
                        <div className="font-medium capitalize">
                          {selectedDayData.weather.condition.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedDayData.weather.temp_max}°C / {selectedDayData.weather.temp_min}
                          °C
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Umbrella className="w-4 h-4 text-blue-500" />
                        <span>{selectedDayData.weather.precipitation} mm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-500" />
                        <span>{selectedDayData.weather.humidity}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Events */}
                {selectedDayData.events && selectedDayData.events.length > 0 ? (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Scheduled Activities</h4>
                    <div className="space-y-2">
                      {selectedDayData.events.map(event => (
                        <div
                          key={event.id}
                          className="p-3 bg-gray-50 rounded-lg border-l-4"
                          style={{ borderLeftColor: getEventColor(event.type).replace('bg-', '') }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{event.title}</span>
                            {event.time && <Badge variant="outline">{event.time}</Badge>}
                          </div>
                          <div className="text-sm text-gray-500 capitalize mt-1">{event.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No activities scheduled</p>
                  </div>
                )}

                {/* Add Event Button */}
                <Button className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>

                {/* Weather Advisory */}
                {selectedDayData.weather?.precipitation &&
                  selectedDayData.weather.precipitation > 20 && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Weather Advisory</span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">
                        Heavy rainfall expected. Consider rescheduling outdoor activities.
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Click on a day to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default WeatherCalendar;
