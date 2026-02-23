/**
 * FARMING ACTIVITIES HOOK
 * ========================
 * Hook for managing farming activity recommendations based on agroecological zones
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../components/ui/use-toast';

import {
  zimbabweAgroecologicalZones,
  getZoneById,
  getZoneRecommendations,
  getMonthlyActivityCalendar,
  getActivitiesByCategory,
  getActivitiesByMonth,
  getOptimalActivities,
  type AgroecologicalZone,
  type FarmingActivity,
} from '../data/agroecologicalZones';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

interface UseFarmingActivitiesReturn {
  // Zone selection
  selectedZone: AgroecologicalZone | null;
  availableZones: AgroecologicalZone[];
  setSelectedZone: (zoneId: number) => void;

  // Time-based filtering
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;

  // Recommendations
  recommendations: {
    zone: AgroecologicalZone | null;
    currentActivities: FarmingActivity[];
    upcomingActivities: FarmingActivity[];
    priorityActivities: FarmingActivity[];
    seasonalAdvice: string[];
  } | null;

  // Activity filtering
  activitiesByCategory: Record<string, FarmingActivity[]>;
  activitiesByMonth: Record<number, FarmingActivity[]>;
  optimalActivities: FarmingActivity[];

  // Calendar view
  yearCalendar: Record<number, FarmingActivity[]>;

  // Search and filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredActivities: FarmingActivity[];

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshRecommendations: () => void;
  clearFilters: () => void;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useFarmingActivities(
  initialZoneId?: number,
  initialMonth?: number
): UseFarmingActivitiesReturn {
  const { toast } = useToast();

  // State management
  const [selectedZoneId, setSelectedZoneId] = useState<number>(initialZoneId || 2);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialMonth || new Date().getMonth() + 1
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const selectedZone = useMemo(() => {
    if (!selectedZoneId) return null;
    return getZoneById(selectedZoneId) ?? null;
  }, [selectedZoneId]);

  const availableZones = useMemo(() => {
    return zimbabweAgroecologicalZones;
  }, []);

  const recommendations = useMemo(() => {
    if (!selectedZoneId) return null;
    try {
      return getZoneRecommendations(selectedZoneId, selectedMonth);
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError('Failed to load recommendations');
      return null;
    }
  }, [selectedZoneId, selectedMonth]);

  const activitiesByCategory = useMemo(() => {
    if (!selectedZoneId) return {};
    const categories = [
      'crop_production',
      'livestock_management',
      'soil_management',
      'water_management',
      'conservation',
      'post_harvest',
    ];
    const result: Record<string, FarmingActivity[]> = {};

    categories.forEach(category => {
      result[category] = getActivitiesByCategory(selectedZoneId, category as any);
    });

    return result;
  }, [selectedZoneId]);

  const activitiesByMonth = useMemo(() => {
    if (!selectedZoneId) return {};
    return getMonthlyActivityCalendar(selectedZoneId);
  }, [selectedZoneId]);

  const optimalActivities = useMemo(() => {
    if (!selectedZoneId) return [];
    return getOptimalActivities(selectedZoneId, selectedMonth);
  }, [selectedZoneId, selectedMonth]);

  const yearCalendar = useMemo(() => {
    if (!selectedZoneId) return {};
    return getMonthlyActivityCalendar(selectedZoneId);
  }, [selectedZoneId]);

  // Search functionality
  const filteredActivities = useMemo(() => {
    if (!selectedZoneId) return [];

    let activities = getActivitiesByMonth(selectedZoneId, selectedMonth);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      activities = activities.filter(
        activity =>
          activity.name.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          activity.category.toLowerCase().includes(query) ||
          activity.requirements.equipment.some(eq => eq.toLowerCase().includes(query)) ||
          activity.expected_outcomes.yield_benefits.some(benefit =>
            benefit.toLowerCase().includes(query)
          )
      );
    }

    return activities;
  }, [selectedZoneId, selectedMonth, searchQuery]);

  // Actions
  const handleZoneChange = (zoneId: number) => {
    setSelectedZoneId(zoneId);
    setError(null);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setError(null);
  };

  const refreshRecommendations = () => {
    setIsLoading(true);
    setError(null);

    try {
      // Force re-fetch by clearing and setting state
      const currentZone = selectedZoneId;
      const currentMonth = selectedMonth;

      setSelectedZoneId(0);
      setSelectedMonth(0);

      setTimeout(() => {
        setSelectedZoneId(currentZone);
        setSelectedMonth(currentMonth);
        setIsLoading(false);
        toast('Recommendations refreshed', 'success');
      }, 100);
    } catch (err) {
      setIsLoading(false);
      setError('Failed to refresh recommendations');
      toast('Failed to refresh recommendations', 'error');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setError(null);
  };

  // Error handling
  useEffect(() => {
    if (error) {
      toast(error, 'error');
    }
  }, [error, toast]);

  // Auto-refresh on month change
  useEffect(() => {
    if (selectedZoneId && selectedMonth) {
      setError(null);
    }
  }, [selectedZoneId, selectedMonth]);

  return {
    // Zone selection
    selectedZone,
    availableZones,
    setSelectedZone: handleZoneChange,

    // Time-based filtering
    selectedMonth,
    setSelectedMonth: handleMonthChange,

    // Recommendations
    recommendations,

    // Activity filtering
    activitiesByCategory,
    activitiesByMonth,
    optimalActivities,

    // Calendar view
    yearCalendar,

    // Search and filter
    searchQuery,
    setSearchQuery,
    filteredActivities,

    // Loading and error states
    isLoading,
    error,

    // Actions
    refreshRecommendations,
    clearFilters,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for getting activities by specific category
 */
export function useActivitiesByCategory(
  zoneId: number,
  category: FarmingActivity['category']
): FarmingActivity[] {
  return useMemo(() => {
    if (!zoneId) return [];
    return getActivitiesByCategory(zoneId, category);
  }, [zoneId, category]);
}

/**
 * Hook for getting priority activities for current month
 */
export function usePriorityActivities(zoneId: number, month?: number): FarmingActivity[] {
  return useMemo(() => {
    if (!zoneId) return [];
    const currentMonth = month || new Date().getMonth() + 1;
    const recommendations = getZoneRecommendations(zoneId, currentMonth);
    return recommendations?.priorityActivities || [];
  }, [zoneId, month]);
}

/**
 * Hook for getting seasonal advice
 */
export function useSeasonalAdvice(zoneId: number, month?: number): string[] {
  return useMemo(() => {
    if (!zoneId) return [];
    const currentMonth = month || new Date().getMonth() + 1;
    const recommendations = getZoneRecommendations(zoneId, currentMonth);
    return recommendations?.seasonalAdvice || [];
  }, [zoneId, month]);
}

/**
 * Hook for managing activity selection and details
 */
export function useActivitySelection() {
  const [selectedActivity, setSelectedActivity] = useState<FarmingActivity | null>(null);
  const [activityHistory, setActivityHistory] = useState<FarmingActivity[]>([]);
  const { toast } = useToast();

  const selectActivity = (activity: FarmingActivity) => {
    setSelectedActivity(activity);
    setActivityHistory(prev => [activity, ...prev.slice(0, 9)]); // Keep last 10 activities
    toast(`Selected: ${activity.name}`, 'success');
  };

  const clearSelection = () => {
    setSelectedActivity(null);
  };

  const clearHistory = () => {
    setActivityHistory([]);
    toast('Activity history cleared', 'success');
  };

  return {
    selectedActivity,
    activityHistory,
    selectActivity,
    clearSelection,
    clearHistory,
  };
}

/**
 * Hook for getting zone-specific statistics
 */
export function useZoneStatistics(zoneId: number) {
  return useMemo(() => {
    const zone = getZoneById(zoneId);
    if (!zone) return null;

    const activities = zone.farming_activities;
    const categories = activities.reduce(
      (acc, activity) => {
        acc[activity.category] = (acc[activity.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const laborRequirements = activities.reduce(
      (acc, activity) => {
        acc[activity.requirements.labor] = (acc[activity.requirements.labor] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const monthlyDistribution = activities.reduce(
      (acc, activity) => {
        for (let month = activity.timing.start_month; month <= activity.timing.end_month; month++) {
          acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
      },
      {} as Record<number, number>
    );

    return {
      totalActivities: activities.length,
      categories,
      laborRequirements,
      monthlyDistribution,
      zoneCharacteristics: zone.characteristics,
      suitableCrops: zone.suitable_crops.length,
      suitableLivestock: zone.suitable_livestock.length,
    };
  }, [zoneId]);
}
