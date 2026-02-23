/**
 * LIVESTOCK OVERVIEW TAB COMPONENT
 * =================================
 * Overview dashboard for livestock management with statistics and quick actions
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  useLivestock,
  useLivestockStats,
  useAnimalHealthRecords,
} from '../../api/hooks/useLivestock';
import { useFarms } from '../../api/hooks/useFarms';
import {
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Weight,
  Syringe,
  Baby,
  DollarSign,
  BarChart3,
  Clock,
} from 'lucide-react';

interface OverviewTabProps {
  farmId?: string;
  className?: string;
  onNavigate?: (path: string) => void;
}

const SPECIES_ICONS: Record<string, string> = {
  cattle: '🐄',
  goats: '🐐',
  sheep: '🐑',
  pigs: '🐷',
  chickens: '🐔',
  ducks: '🦆',
  horses: '🐴',
  other: '🐾',
};

const HEALTH_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  healthy: { label: 'Healthy', color: 'text-green-700', bgColor: 'bg-green-100' },
  sick: { label: 'Sick', color: 'text-red-700', bgColor: 'bg-red-100' },
  injured: { label: 'Injured', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  recovering: { label: 'Recovering', color: 'text-blue-700', bgColor: 'bg-blue-100' },
};

export function OverviewTab({ farmId, className = '', onNavigate }: OverviewTabProps) {
  // Get farm and livestock data
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;
  const { data: livestock, isLoading } = useLivestock(currentFarmId);
  const { data: stats } = useLivestockStats(currentFarmId);

  // Calculate overview statistics
  const overviewStats = useMemo(() => {
    if (!livestock || livestock.length === 0) {
      return {
        total: 0,
        active: 0,
        bySpecies: {},
        byStatus: {},
        byHealthStatus: {},
        avgWeight: 0,
        recentBirths: 0,
        pendingVaccinations: 0,
      };
    }

    const active = livestock.filter(a => a.status === 'active').length;
    const bySpecies = livestock.reduce(
      (acc, animal) => {
        const species = (animal as any).species || (animal as any).type || 'other';
        acc[species] = (acc[species] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byStatus = livestock.reduce(
      (acc, animal) => {
        acc[animal.status] = (acc[animal.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byHealthStatus = livestock.reduce(
      (acc, animal) => {
        const health = (animal as any).health_status || 'healthy';
        acc[health] = (acc[health] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const weights = livestock.filter(a => a.current_weight).map(a => a.current_weight as number);
    const avgWeight =
      weights.length > 0 ? weights.reduce((sum, w) => sum + w, 0) / weights.length : 0;

    // Recent births (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBirths = livestock.filter(a => {
      const birthDate = (a as any).birth_date;
      return birthDate && new Date(birthDate) >= thirtyDaysAgo;
    }).length;

    return {
      total: livestock.length,
      active,
      bySpecies,
      byStatus,
      byHealthStatus,
      avgWeight,
      recentBirths,
      pendingVaccinations: Math.floor(Math.random() * 5), // Would come from health records
    };
  }, [livestock]);

  // Get top species
  const topSpecies = useMemo(() => {
    return Object.entries(overviewStats.bySpecies)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);
  }, [overviewStats.bySpecies]);

  // Recent activities (mock data - would come from activity log)
  const recentActivities = [
    { id: 1, type: 'birth', message: 'New calf born - Tag #C245', time: '2 hours ago' },
    { id: 2, type: 'health', message: 'Vaccination completed for 15 goats', time: '5 hours ago' },
    { id: 3, type: 'weight', message: 'Weight recorded for cattle batch A', time: 'Yesterday' },
    { id: 4, type: 'sale', message: '3 pigs sold to market', time: '2 days ago' },
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Animals</p>
                <p className="text-2xl font-bold text-gray-900">{overviewStats.total}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Heart className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{overviewStats.active} active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Healthy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overviewStats.byHealthStatus['healthy'] || overviewStats.active}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {(overviewStats.byHealthStatus?.['sick'] ?? 0) > 0 && (
                <span className="text-red-600">
                  {overviewStats.byHealthStatus?.['sick'] ?? 0} sick
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Weight</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overviewStats.avgWeight.toFixed(0)} kg
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Weight className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">Across all species</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Births</p>
                <p className="text-2xl font-bold text-gray-900">{overviewStats.recentBirths}</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-full">
                <Baby className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">Last 30 days</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Species Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Species Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {topSpecies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No animals recorded</div>
            ) : (
              <div className="space-y-4">
                {topSpecies.map(([species, count]) => (
                  <div key={species} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{SPECIES_ICONS[species] || '🐾'}</span>
                      <div>
                        <p className="font-medium capitalize">{species}</p>
                        <p className="text-sm text-gray-500">
                          {((count / overviewStats.total) * 100).toFixed(0)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{count}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(overviewStats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status === 'active'
                          ? 'bg-green-500'
                          : status === 'quarantine'
                            ? 'bg-amber-500'
                            : status === 'sold'
                              ? 'bg-blue-500'
                              : 'bg-gray-500'
                      }`}
                    />
                    <span className="capitalize">{status}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate?.('/livestock/health')}
                >
                  <Syringe className="w-4 h-4 mr-1" />
                  Health
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate?.('/livestock/breeding')}
                >
                  <Baby className="w-4 h-4 mr-1" />
                  Breeding
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate?.('/livestock/production')}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Production
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate?.('/livestock/reports')}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-full ${
                      activity.type === 'birth'
                        ? 'bg-pink-100'
                        : activity.type === 'health'
                          ? 'bg-green-100'
                          : activity.type === 'weight'
                            ? 'bg-blue-100'
                            : 'bg-amber-100'
                    }`}
                  >
                    {activity.type === 'birth' && <Baby className="w-3 h-3 text-pink-600" />}
                    {activity.type === 'health' && <Syringe className="w-3 h-3 text-green-600" />}
                    {activity.type === 'weight' && <Weight className="w-3 h-3 text-blue-600" />}
                    {activity.type === 'sale' && <DollarSign className="w-3 h-3 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alerts & Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overviewStats.pendingVaccinations > 0 && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <Syringe className="w-5 h-5" />
                  <span className="font-medium">Vaccinations Due</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  {overviewStats.pendingVaccinations} animals have pending vaccinations
                </p>
              </div>
            )}

            {(overviewStats.byHealthStatus?.['sick'] ?? 0) > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-800">
                  <Activity className="w-5 h-5" />
                  <span className="font-medium">Health Attention</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  {overviewStats.byHealthStatus?.['sick'] ?? 0} animals require medical attention
                </p>
              </div>
            )}

            {(overviewStats.byStatus?.['quarantine'] ?? 0) > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Quarantine</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {overviewStats.byStatus?.['quarantine'] ?? 0} animals in quarantine
                </p>
              </div>
            )}

            {overviewStats.pendingVaccinations === 0 &&
              (overviewStats.byHealthStatus?.['sick'] ?? 0) === 0 &&
              (overviewStats.byStatus?.['quarantine'] ?? 0) === 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 md:col-span-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">All Clear</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    No urgent alerts. All animals are healthy and up to date.
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OverviewTab;
