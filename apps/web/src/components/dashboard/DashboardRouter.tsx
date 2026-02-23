/**
 * DASHBOARD ROUTER COMPONENT
 * ==========================
 * Routes to appropriate dashboard based on user role and context
 */

import React, { useMemo } from 'react';
import { useAuth } from '../../hooks/AuthContext';
import { useFarms } from '../../api/hooks/useFarms';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Sprout,
  Tractor,
  DollarSign,
  Users,
  Settings,
  BarChart3,
  Calendar,
  Cloud,
  Package,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface DashboardRouterProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  bgColor: string;
}

const DASHBOARD_CARDS: DashboardCard[] = [
  {
    title: 'Farm Overview',
    description: 'View farm statistics and recent activity',
    icon: <LayoutDashboard className="w-6 h-6" />,
    path: '/dashboard',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Crop Management',
    description: 'Manage crops, fields, and rotations',
    icon: <Sprout className="w-6 h-6" />,
    path: '/crops',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Livestock',
    description: 'Track animals, health, and production',
    icon: <Tractor className="w-6 h-6" />,
    path: '/livestock',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  {
    title: 'Finance',
    description: 'Income, expenses, and budgets',
    icon: <DollarSign className="w-6 h-6" />,
    path: '/finance',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    title: 'Inventory',
    description: 'Stock levels and supplies',
    icon: <Package className="w-6 h-6" />,
    path: '/inventory',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Tasks',
    description: 'Daily tasks and schedules',
    icon: <Calendar className="w-6 h-6" />,
    path: '/tasks',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    title: 'Weather',
    description: 'Forecasts and alerts',
    icon: <Cloud className="w-6 h-6" />,
    path: '/weather',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  {
    title: 'Analytics',
    description: 'Reports and insights',
    icon: <BarChart3 className="w-6 h-6" />,
    path: '/analytics',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
];

export function DashboardRouter({ className = '', onNavigate }: DashboardRouterProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: farms, isLoading: farmsLoading, error } = useFarms();

  const isLoading = authLoading || farmsLoading;

  // Determine user's primary farm
  const primaryFarm = useMemo(() => {
    if (!farms || farms.length === 0) return null;
    return farms[0];
  }, [farms]);

  // Calculate quick stats
  const quickStats = useMemo(() => {
    return {
      totalFarms: farms?.length || 0,
      activeModules: DASHBOARD_CARDS.length,
      alerts: 3, // This would come from an alerts API
    };
  }, [farms]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600 mb-4">Failed to load farm data. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!primaryFarm) {
    return (
      <div className={`p-8 ${className}`}>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <Sprout className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">No Farms Found</h3>
            <p className="text-amber-600 mb-4">Get started by creating your first farm.</p>
            <Button onClick={() => onNavigate?.('/farms/new')}>Create Farm</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name || 'Farmer'}!</h1>
            <p className="text-green-100">Managing {primaryFarm.name || 'your farm'}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{quickStats.totalFarms}</div>
              <div className="text-sm text-green-100">Farms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{quickStats.alerts}</div>
              <div className="text-sm text-green-100">Alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DASHBOARD_CARDS.map(card => (
            <Card
              key={card.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate?.(card.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <span className={card.color}>{card.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{card.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{card.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[
                { action: 'Added new crop planting', time: '2 hours ago', type: 'crop' },
                { action: 'Updated livestock records', time: '5 hours ago', type: 'livestock' },
                { action: 'Recorded expense entry', time: 'Yesterday', type: 'finance' },
                { action: 'Completed task: Irrigation check', time: 'Yesterday', type: 'task' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === 'crop'
                        ? 'bg-green-500'
                        : activity.type === 'livestock'
                          ? 'bg-amber-500'
                          : activity.type === 'finance'
                            ? 'bg-emerald-500'
                            : 'bg-orange-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Active Alerts
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              {[
                {
                  message: 'Low inventory: Fertilizer stock below threshold',
                  severity: 'high',
                  time: '1 hour ago',
                },
                {
                  message: 'Weather alert: Heavy rain expected tomorrow',
                  severity: 'medium',
                  time: '3 hours ago',
                },
                { message: 'Task overdue: Pest inspection', severity: 'low', time: '1 day ago' },
              ].map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    alert.severity === 'high'
                      ? 'bg-red-50 border border-red-200'
                      : alert.severity === 'medium'
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farm Summary */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Farm Summary</h3>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Sprout className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-500">Active Crops</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Tractor className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">45</div>
              <div className="text-sm text-gray-500">Livestock</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">8</div>
              <div className="text-sm text-gray-500">Pending Tasks</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">$2.4k</div>
              <div className="text-sm text-gray-500">This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardRouter;
