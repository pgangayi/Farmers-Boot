/**
 * ENHANCED FARM CALENDAR COMPONENT
 * =================================
 * Comprehensive farm calendar with events, tasks, and planning features
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTasks } from '../api/hooks/useTasks';
import { useFarms } from '../api/hooks/useFarms';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Sprout,
  Tractor,
  Droplets,
  Bug,
  Scissors,
  Package,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  Filter,
  List,
  Calendar,
  X,
} from 'lucide-react';

interface EnhancedFarmCalendarProps {
  farmId?: string;
  className?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  type: 'task' | 'planting' | 'harvest' | 'irrigation' | 'spraying' | 'meeting' | 'finance';
  date: string;
  endDate?: string;
  time?: string;
  description?: string;
  location?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

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

// Event type configuration
const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  task: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  planting: {
    icon: <Sprout className="w-4 h-4" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  harvest: {
    icon: <Scissors className="w-4 h-4" />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  irrigation: {
    icon: <Droplets className="w-4 h-4" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  spraying: { icon: <Bug className="w-4 h-4" />, color: 'text-red-700', bgColor: 'bg-red-100' },
  meeting: {
    icon: <Users className="w-4 h-4" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  finance: {
    icon: <DollarSign className="w-4 h-4" />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'border-l-gray-400',
  medium: 'border-l-blue-500',
  high: 'border-l-amber-500',
  urgent: 'border-l-red-500',
};

// Helper function to get event config safely
const DEFAULT_CONFIG = {
  icon: <CheckCircle className="w-4 h-4" />,
  color: 'text-gray-700',
  bgColor: 'bg-gray-100',
};
const getEventConfig = (type: string): { icon: React.ReactNode; color: string; bgColor: string } =>
  EVENT_CONFIG[type] || DEFAULT_CONFIG;

// Sample events data
const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Plant Maize - Field A',
    type: 'planting',
    date: new Date().toISOString().split('T')[0] as string,
    time: '08:00',
    description: 'Plant SC 513 maize variety in Field A',
    location: 'Field A - North Section',
    status: 'scheduled',
    priority: 'high',
    assignee: 'John M.',
  },
  {
    id: '2',
    title: 'Irrigate Vegetables',
    type: 'irrigation',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0] as string,
    time: '06:00',
    location: 'Field C - Irrigated',
    status: 'scheduled',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Harvest Tomatoes',
    type: 'harvest',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] as string,
    time: '07:00',
    description: 'Harvest Roma tomatoes from greenhouse',
    status: 'scheduled',
    priority: 'high',
  },
  {
    id: '4',
    title: 'Pest Control - Field B',
    type: 'spraying',
    date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] as string,
    time: '10:00',
    description: 'Apply pesticide for fall armyworm control',
    status: 'scheduled',
    priority: 'urgent',
  },
  {
    id: '5',
    title: 'Staff Meeting',
    type: 'meeting',
    date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0] as string,
    time: '14:00',
    description: 'Weekly farm operations meeting',
    status: 'scheduled',
    priority: 'medium',
  },
  {
    id: '6',
    title: 'Pay Suppliers',
    type: 'finance',
    date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0] as string,
    description: 'Payment due for fertilizer supplier',
    status: 'scheduled',
    priority: 'high',
  },
];

// Generate calendar days
const generateCalendarDays = (
  year: number,
  month: number,
  events: CalendarEvent[]
): CalendarDay[] => {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDay[] = [];

  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const dateStr = currentDate.toISOString().split('T')[0];
    const dayEvents = events.filter(e => e.date === dateStr);

    days.push({
      date: currentDate,
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: currentDate.getTime() === today.getTime(),
      events: dayEvents,
    });
  }

  return days;
};

export function EnhancedFarmCalendar({ farmId, className = '' }: EnhancedFarmCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddEvent, setShowAddEvent] = useState(false);

  // Get farm data
  const { data: farms } = useFarms();
  const { data: tasks } = useTasks({ farm_id: farmId || farms?.[0]?.id });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return SAMPLE_EVENTS;
    return SAMPLE_EVENTS.filter(e => e.type === filterType);
  }, [filterType]);

  // Generate calendar days
  const calendarDays = useMemo(
    () => generateCalendarDays(year, month, filteredEvents),
    [year, month, filteredEvents]
  );

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0] as string;
    return filteredEvents
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [filteredEvents]);

  // Statistics
  const stats = useMemo(() => {
    const thisMonth = filteredEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
    return {
      total: thisMonth.length,
      highPriority: thisMonth.filter(e => e.priority === 'high' || e.priority === 'urgent').length,
      completed: thisMonth.filter(e => e.status === 'completed').length,
    };
  }, [filteredEvents, month, year]);

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

  // Selected day events
  const selectedDayEvents = selectedDate
    ? filteredEvents.filter(e => e.date === selectedDate.toISOString().split('T')[0])
    : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Farm Calendar
          </h2>
          <p className="text-gray-600">Manage farm activities and events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button onClick={() => setShowAddEvent(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total} events</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{stats.highPriority}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
              <div className="flex gap-2">
                <select
                  title="Filter by type"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="planting">Planting</option>
                  <option value="harvest">Harvest</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="spraying">Spraying</option>
                  <option value="task">Tasks</option>
                  <option value="meeting">Meetings</option>
                  <option value="finance">Finance</option>
                </select>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                  >
                    <Calendar className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'month' ? (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(day.date)}
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
                        <span
                          className={`text-sm font-medium ${day.isToday ? 'text-green-600' : ''}`}
                        >
                          {day.date.getDate()}
                        </span>
                        {day.events.length > 0 && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {day.events.slice(0, 2).map(event => {
                          const config = getEventConfig(event.type);
                          return (
                            <div
                              key={event.id}
                              className={`text-xs px-1 py-0.5 rounded truncate border-l-2 ${config.bgColor} ${PRIORITY_COLORS[event.priority] || ''}`}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {day.events.length > 2 && (
                          <div className="text-xs text-gray-500">+{day.events.length - 2} more</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* List View */
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No events found</div>
                ) : (
                  filteredEvents.map(event => {
                    const config = getEventConfig(event.type);
                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border-l-4 ${config.bgColor} ${PRIORITY_COLORS[event.priority] || ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {config.icon}
                            <div>
                              <h4 className="font-medium text-gray-900">{event.title}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                {event.time && ` at ${event.time}`}
                              </p>
                            </div>
                          </div>
                          <Badge className={config.bgColor}>{event.type}</Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Day Events */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No events scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayEvents.map(event => {
                      const config = getEventConfig(event.type);
                      return (
                        <div key={event.id} className={`p-3 rounded-lg ${config.bgColor}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {config.icon}
                            <span className="font-medium">{event.title}</span>
                          </div>
                          {event.time && (
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.time}
                            </div>
                          )}
                          {event.location && (
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedDate(new Date(event.date))}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{event.title}</span>
                      <Badge className={getEventConfig(event.type).bgColor} variant="outline">
                        {event.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {event.time && ` • ${event.time}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Event Type Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(EVENT_CONFIG).map(([type, config]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`p-1 rounded ${config.bgColor}`}>{config.icon}</div>
                    <span className="text-sm capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Event</CardTitle>
              <button
                onClick={() => setShowAddEvent(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="Event title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    title="Select event type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="task">Task</option>
                    <option value="planting">Planting</option>
                    <option value="harvest">Harvest</option>
                    <option value="irrigation">Irrigation</option>
                    <option value="spraying">Spraying</option>
                    <option value="meeting">Meeting</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    title="Select priority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Event description..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddEvent(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Event</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default EnhancedFarmCalendar;
