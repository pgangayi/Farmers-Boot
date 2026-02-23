/**
 * FARMING ACTIVITY RECOMMENDER COMPONENT
 * ====================================
 * Provides location-based farming activity recommendations for Zimbabwe's agroecological zones
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Droplets,
  Thermometer,
  Wind,
  Clock,
  Users,
  Package,
} from 'lucide-react';

import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from './ui/use-toast';

import {
  zimbabweAgroecologicalZones,
  getZoneById,
  getZoneRecommendations,
  getMonthlyActivityCalendar,
  type AgroecologicalZone,
  type FarmingActivity,
} from '../data/agroecologicalZones';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface FarmingActivityRecommenderProps {
  selectedZoneId?: number;
  currentMonth?: number;
  onActivitySelect?: (activity: FarmingActivity) => void;
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const ActivityCard: React.FC<{
  activity: FarmingActivity;
  onSelect?: (activity: FarmingActivity) => void;
}> = ({ activity, onSelect }) => {
  const getCategoryIcon = (category: FarmingActivity['category']) => {
    const icons: Record<FarmingActivity['category'], React.ReactNode> = {
      crop_production: <Package className="h-4 w-4" />,
      livestock_management: <Users className="h-4 w-4" />,
      soil_management: <Wind className="h-4 w-4" />,
      water_management: <Droplets className="h-4 w-4" />,
      conservation: <AlertTriangle className="h-4 w-4" />,
      post_harvest: <Package className="h-4 w-4" />,
    };
    return icons[category] || <Package className="h-4 w-4" />;
  };

  const getCategoryColor = (category: FarmingActivity['category']) => {
    const colors: Record<FarmingActivity['category'], string> = {
      crop_production: 'bg-green-100 text-green-800',
      livestock_management: 'bg-blue-100 text-blue-800',
      soil_management: 'bg-amber-100 text-amber-800',
      water_management: 'bg-cyan-100 text-cyan-800',
      conservation: 'bg-purple-100 text-purple-800',
      post_harvest: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getLaborColor = (labor: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return colors[labor] || 'bg-gray-100 text-gray-800';
  };

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getCategoryColor(activity.category)}`}>
              {getCategoryIcon(activity.category)}
            </div>
            <div>
              <CardTitle className="text-lg">{activity.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {activity.category.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onSelect?.(activity)}>
            View Details
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{activity.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timing
            </h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Optimal:</strong>{' '}
                {activity.timing.optimal_months.map(m => monthNames[m - 1]).join(', ')}
              </p>
              <p>
                <strong>Period:</strong> {monthNames[activity.timing.start_month - 1]} -{' '}
                {monthNames[activity.timing.end_month - 1]}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Requirements
            </h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Labor:</strong>{' '}
                <Badge className={getLaborColor(activity.requirements.labor)}>
                  {activity.requirements.labor}
                </Badge>
              </p>
              <p>
                <strong>Equipment:</strong> {activity.requirements.equipment.slice(0, 2).join(', ')}
                {activity.requirements.equipment.length > 2 ? '...' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-2">Expected Outcomes</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-green-700">Yield Benefits</p>
              <ul className="list-disc list-inside text-gray-600">
                {activity.expected_outcomes.yield_benefits.slice(0, 2).map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-700">Environmental Benefits</p>
              <ul className="list-disc list-inside text-gray-600">
                {activity.expected_outcomes.environmental_benefits
                  .slice(0, 2)
                  .map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-purple-700">Economic Benefits</p>
              <ul className="list-disc list-inside text-gray-600">
                {activity.expected_outcomes.economic_benefits.slice(0, 2).map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {activity.risk_factors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Factors
            </h4>
            <ul className="list-disc list-inside text-sm text-red-700">
              {activity.risk_factors.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FarmingActivityRecommender({
  selectedZoneId,
  currentMonth = new Date().getMonth() + 1,
  onActivitySelect,
  className,
}: FarmingActivityRecommenderProps) {
  const { toast } = useToast();
  const [selectedZone, setSelectedZone] = useState<number>(selectedZoneId || 2);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [recommendations, setRecommendations] = useState<ReturnType<
    typeof getZoneRecommendations
  > | null>(null);
  const [yearCalendar, setYearCalendar] = useState<Record<number, FarmingActivity[]>>({});
  const [activeTab, setActiveTab] = useState<'current' | 'calendar' | 'zone-info'>('current');

  useEffect(() => {
    if (selectedZone) {
      try {
        const zoneRecommendations = getZoneRecommendations(selectedZone, selectedMonth);
        setRecommendations(zoneRecommendations);

        const calendar = getMonthlyActivityCalendar(selectedZone);
        setYearCalendar(calendar);
      } catch (error) {
        console.error('Error getting zone recommendations:', error);
        toast('Failed to load zone recommendations', 'error');
      }
    }
  }, [selectedZone, selectedMonth, toast]);

  const handleZoneChange = (zoneId: string) => {
    const zone = parseInt(zoneId);
    setSelectedZone(zone);
  };

  const handleMonthChange = (month: string) => {
    const monthNum = parseInt(month);
    setSelectedMonth(monthNum);
  };

  const zone = selectedZone ? getZoneById(selectedZone) : null;
  const monthNames = [
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

  if (!zone) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Select an agroecological zone to see farming recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Zone and Month Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Timing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Agroecological Zone</label>
              <Select value={selectedZone.toString()} onValueChange={handleZoneChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zimbabweAgroecologicalZones.map(zone => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      <div>
                        <div className="font-medium">{zone.name}</div>
                        <div className="text-sm text-gray-500">{zone.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Current Month</label>
              <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, idx) => (
                    <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Characteristics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Zone Characteristics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Rainfall</p>
                <p className="font-medium">{zone.characteristics.rainfall_mm}mm</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Temperature</p>
                <p className="font-medium">{zone.characteristics.temperature_range}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Growing Season</p>
                <p className="font-medium">{zone.characteristics.growing_season_days} days</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Climate</p>
                <p className="font-medium">{zone.characteristics.climate_classification}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Suitable Crops:</p>
            <div className="flex flex-wrap gap-2">
              {zone.suitable_crops.slice(0, 8).map((crop, idx) => (
                <Badge key={idx} variant="secondary">
                  {crop}
                </Badge>
              ))}
              {zone.suitable_crops.length > 8 && (
                <Badge variant="outline">+{zone.suitable_crops.length - 8} more</Badge>
              )}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Suitable Livestock:</p>
            <div className="flex flex-wrap gap-2">
              {zone.suitable_livestock.map((livestock, idx) => (
                <Badge key={idx} variant="outline">
                  {livestock}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations && (
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as any)}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Current Activities</TabsTrigger>
            <TabsTrigger value="calendar">Year Calendar</TabsTrigger>
            <TabsTrigger value="zone-info">Zone Info</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Priority Activities ({recommendations.priorityActivities.length})
                  </h3>
                  {recommendations.priorityActivities.length > 0 ? (
                    <div className="space-y-3">
                      {recommendations.priorityActivities.map(activity => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          onSelect={onActivitySelect}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No priority activities for this month</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    All Current Activities ({recommendations.currentActivities.length})
                  </h3>
                  {recommendations.currentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {recommendations.currentActivities.map(activity => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          onSelect={onActivitySelect}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No activities recommended for this month</p>
                  )}
                </div>
              </div>

              {recommendations.seasonalAdvice.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">Seasonal Advice</h3>
                  <ul className="space-y-2">
                    {recommendations.seasonalAdvice.map((advice, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-blue-700">{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(yearCalendar).map(([month, activities]) => (
                <Card key={month} className="h-fit">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center">{monthNames[parseInt(month) - 1]}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {activities.length > 0 ? (
                      <div className="space-y-2">
                        {activities.slice(0, 3).map(activity => (
                          <div key={activity.id} className="text-sm">
                            <Badge variant="outline" className="text-xs mb-1">
                              {activity.category.replace('_', ' ')}
                            </Badge>
                            <p className="font-medium truncate">{activity.name}</p>
                          </div>
                        ))}
                        {activities.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{activities.length - 3} more activities
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">No activities</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="zone-info" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-700">Opportunities</h3>
                <ul className="space-y-2">
                  {zone.opportunities.map((opportunity, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-green-700">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-700">Challenges</h3>
                <ul className="space-y-2">
                  {zone.challenges.map((challenge, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-red-700">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default FarmingActivityRecommender;
