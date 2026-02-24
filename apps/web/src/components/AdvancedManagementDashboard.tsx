import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  Zap,
  Target,
  Settings,
  Download,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiClient } from '@/lib';
import { useFarms } from '@/api/hooks/useFarms';
import { useTasks } from '@/api/hooks/useTasks';
import { useFinance } from '@/api/hooks/useFinance';
import { useInventory } from '@/api/hooks/useInventory';
import { useLivestock } from '@/api/hooks/useLivestock';
import { useCrops } from '@/api/hooks/useCrops';

interface KPI {
  id: string;
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  unit?: string;
  target?: number;
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

interface ActivityItem {
  id: string;
  type: 'task' | 'alert' | 'update' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'completed' | 'pending' | 'in_progress';
}

interface ResourceUtilization {
  resource: string;
  used: number;
  total: number;
  percentage: number;
  status: 'optimal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

interface AdvancedManagementDashboardProps {
  farmId?: string;
}

const AdvancedManagementDashboard: React.FC<AdvancedManagementDashboardProps> = ({ farmId }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // API hooks for real data
  const { data: farmsData, isLoading: farmsLoading } = useFarms();
  const { data: tasksData, isLoading: tasksLoading } = useTasks(
    farmId ? { farm_id: farmId } : undefined
  );
  const { data: financeData, isLoading: financeLoading } = useFinance(
    farmId ? { farm_id: farmId } : undefined
  );
  const { data: inventoryData, isLoading: inventoryLoading } = useInventory(farmId);
  const { data: livestockData, isLoading: livestockLoading } = useLivestock(farmId);
  const { data: cropsData, isLoading: cropsLoading } = useCrops(farmId);

  // Fetch KPIs from API
  const {
    data: kpis,
    isLoading: kpisLoading,
    refetch: refetchKpis,
  } = useQuery<KPI[]>({
    queryKey: ['kpis', selectedTimeRange, selectedDepartment, farmId],
    queryFn: async (): Promise<KPI[]> => {
      const params = new URLSearchParams({
        time_range: selectedTimeRange,
        department: selectedDepartment,
        ...(farmId && { farm_id: farmId }),
      });
      const result = await apiClient.get<KPI[]>(`/dashboard/kpis?${params}`);
      return result || [];
    },
  });

  // Fetch activities from API
  const {
    data: activities,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useQuery<ActivityItem[]>({
    queryKey: ['activities', selectedTimeRange, farmId],
    queryFn: async (): Promise<ActivityItem[]> => {
      const params = new URLSearchParams({
        time_range: selectedTimeRange,
        ...(farmId && { farm_id: farmId }),
      });
      const result = await apiClient.get<ActivityItem[]>(`/dashboard/activities?${params}`);
      return result || [];
    },
  });

  // Fetch resource utilization from API
  const {
    data: resources,
    isLoading: resourcesLoading,
    refetch: refetchResources,
  } = useQuery<ResourceUtilization[]>({
    queryKey: ['resources', farmId],
    queryFn: async (): Promise<ResourceUtilization[]> => {
      const params = farmId ? `?farm_id=${farmId}` : '';
      const result = await apiClient.get<ResourceUtilization[]>(`/dashboard/resources${params}`);
      return result || [];
    },
  });

  // Calculate derived KPIs from real data if API doesn't return them
  const derivedKPIs = useMemo((): KPI[] => {
    if (kpis && kpis.length > 0) return kpis;

    const calculatedKPIs: KPI[] = [];

    // Revenue KPI from finance data
    if (financeData && financeData.length > 0) {
      const totalRevenue = financeData
        .filter((entry: any) => entry.type === 'income')
        .reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
      const totalExpenses = financeData
        .filter((entry: any) => entry.type === 'expense')
        .reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
      const netIncome = totalRevenue - totalExpenses;

      calculatedKPIs.push({
        id: 'revenue',
        title: 'Net Income',
        value: netIncome,
        unit: '$',
        status: netIncome > 0 ? 'good' : 'warning',
        icon: <DollarSign className="h-5 w-5" />,
      });
    }

    // Active tasks KPI
    if (tasksData) {
      const activeTasks = tasksData.filter(
        (task: any) => task.status !== 'completed' && task.status !== 'done'
      ).length;
      const highPriorityTasks = tasksData.filter(
        (task: any) => task.priority === 'high' && task.status !== 'completed'
      ).length;

      calculatedKPIs.push({
        id: 'tasks',
        title: 'Active Tasks',
        value: activeTasks,
        status: highPriorityTasks > 5 ? 'warning' : 'good',
        icon: <Activity className="h-5 w-5" />,
      });
    }

    // Inventory KPI
    if (inventoryData && inventoryData.length > 0) {
      const lowStockItems = inventoryData.filter(
        (item: any) => item.quantity <= (item.reorder_level || 10)
      ).length;
      const totalItems = inventoryData.length;

      calculatedKPIs.push({
        id: 'inventory',
        title: 'Inventory Status',
        value: `${totalItems - lowStockItems}/${totalItems}`,
        status: lowStockItems > totalItems * 0.2 ? 'warning' : 'good',
        icon: <Package className="h-5 w-5" />,
      });
    }

    // Livestock KPI
    if (livestockData && livestockData.length > 0) {
      const healthyAnimals = livestockData.filter(
        (animal: any) => animal.health_status === 'healthy' || animal.status === 'healthy'
      ).length;
      const totalAnimals = livestockData.length;

      calculatedKPIs.push({
        id: 'livestock',
        title: 'Livestock Health',
        value: Math.round((healthyAnimals / totalAnimals) * 100),
        unit: '%',
        status: healthyAnimals / totalAnimals > 0.9 ? 'good' : 'warning',
        icon: <Users className="h-5 w-5" />,
      });
    }

    return calculatedKPIs;
  }, [kpis, financeData, tasksData, inventoryData, livestockData]);

  // Build activities from real data if API doesn't return them
  const derivedActivities = useMemo((): ActivityItem[] => {
    if (activities && activities.length > 0) return activities;

    const activityItems: ActivityItem[] = [];

    // Add recent tasks as activities
    if (tasksData && tasksData.length > 0) {
      const recentTasks = tasksData.slice(0, 5);
      recentTasks.forEach((task: any) => {
        activityItems.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title || 'Task',
          description: task.description || task.category || 'Task activity',
          timestamp: task.updated_at || task.created_at || new Date().toISOString(),
          user: task.assigned_to,
          priority: task.priority,
          status: task.status,
        });
      });
    }

    // Add inventory alerts
    if (inventoryData && inventoryData.length > 0) {
      const lowStock = inventoryData
        .filter((item: any) => item.quantity <= (item.reorder_level || 10))
        .slice(0, 3);

      lowStock.forEach((item: any) => {
        activityItems.push({
          id: `alert-${item.id}`,
          type: 'alert',
          title: `Low Stock: ${item.name}`,
          description: `Only ${item.quantity} ${item.unit || 'units'} remaining`,
          timestamp: new Date().toISOString(),
          priority: 'high',
          status: 'pending',
        });
      });
    }

    // Sort by timestamp
    return activityItems
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [activities, tasksData, inventoryData]);

  // Build resource utilization from real data
  const derivedResources = useMemo((): ResourceUtilization[] => {
    if (resources && resources.length > 0) return resources;

    const resourceList: ResourceUtilization[] = [];

    // Equipment utilization from inventory
    if (inventoryData && inventoryData.length > 0) {
      const equipment = inventoryData.filter(
        (item: any) => item.category === 'equipment' || item.type === 'equipment'
      );
      if (equipment.length > 0) {
        const inUse = equipment.filter((item: any) => item.status === 'in_use').length;
        resourceList.push({
          resource: 'Equipment',
          used: inUse,
          total: equipment.length,
          percentage: Math.round((inUse / equipment.length) * 100),
          status: inUse / equipment.length > 0.8 ? 'optimal' : 'warning',
          trend: 'stable',
        });
      }
    }

    // Storage utilization
    if (inventoryData && inventoryData.length > 0) {
      const totalQuantity = inventoryData.reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      );
      const maxCapacity = 10000; // This should come from API
      resourceList.push({
        resource: 'Storage',
        used: totalQuantity,
        total: maxCapacity,
        percentage: Math.round((totalQuantity / maxCapacity) * 100),
        status: totalQuantity / maxCapacity > 0.9 ? 'warning' : 'optimal',
        trend: 'up',
      });
    }

    // Crop fields
    if (cropsData && cropsData.length > 0) {
      const activeCrops = cropsData.filter(
        (crop: any) => crop.status === 'growing' || crop.status === 'planted'
      ).length;
      resourceList.push({
        resource: 'Active Fields',
        used: activeCrops,
        total: cropsData.length,
        percentage: Math.round((activeCrops / cropsData.length) * 100),
        status: 'optimal',
        trend: 'stable',
      });
    }

    return resourceList;
  }, [resources, inventoryData, cropsData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'task':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleRefresh = () => {
    refetchKpis();
    refetchActivities();
    refetchResources();
  };

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Generate Report',
      description: 'Create comprehensive farm performance report',
      icon: <Download className="h-4 w-4" />,
      action: () => {
        // Navigate to reports page or open report modal
        console.log('Generate report');
      },
      variant: 'default',
    },
    {
      id: '2',
      title: 'Schedule Maintenance',
      description: 'Schedule equipment maintenance tasks',
      icon: <Calendar className="h-4 w-4" />,
      action: () => {
        // Navigate to task creation
        console.log('Schedule maintenance');
      },
      variant: 'default',
    },
    {
      id: '3',
      title: 'View Alerts',
      description: 'Review all active alerts and notifications',
      icon: <Eye className="h-4 w-4" />,
      action: () => {
        // Navigate to alerts page
        console.log('View alerts');
      },
      variant: 'outline',
    },
    {
      id: '4',
      title: 'Emergency Shutdown',
      description: 'Initiate emergency shutdown procedures',
      icon: <AlertTriangle className="h-4 w-4" />,
      action: () => {
        // Emergency action
        console.log('Emergency shutdown');
      },
      variant: 'destructive',
    },
  ];

  const isLoading = kpisLoading || activitiesLoading || resourcesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Advanced Management Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive farm management and operational insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Department:
            </label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-40" title="Select department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="crops">Crops</SelectItem>
                <SelectItem value="livestock">Livestock</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Range:
            </label>
            <Select
              value={selectedTimeRange}
              onValueChange={(v: string) => setSelectedTimeRange(v as '24h' | '7d' | '30d' | '90d')}
            >
              <SelectTrigger className="w-32" title="Select time range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          : derivedKPIs.map(kpi => (
              <Card key={kpi.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {kpi.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {kpi.icon}
                    <Badge
                      className={cn(
                        'text-xs',
                        kpi.status === 'good'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : kpi.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      )}
                    >
                      {kpi.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {kpi.unit}
                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                      </div>
                      {kpi.change && (
                        <div
                          className={cn(
                            'flex items-center text-sm font-medium',
                            kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {kpi.changeType === 'increase' ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(kpi.change)}%
                        </div>
                      )}
                    </div>
                    {kpi.target && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Target:</span>
                          <span className="font-medium">
                            {kpi.unit}
                            {kpi.target.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={(Number(kpi.value) / kpi.target) * 100} className="h-2" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Utilization Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    Resource Utilization Overview
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {resourcesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : derivedResources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No resource data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {derivedResources.map(resource => (
                      <div key={resource.resource} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{resource.resource}</span>
                          <Badge
                            className={
                              resource.status === 'optimal'
                                ? 'bg-green-100 text-green-800'
                                : resource.status === 'warning'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }
                          >
                            {resource.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {resource.used.toLocaleString()} / {resource.total.toLocaleString()}
                            </span>
                            <span className="font-medium">{resource.percentage}%</span>
                          </div>
                          <Progress value={resource.percentage} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : derivedActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {derivedActivities.map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            {activity.priority && (
                              <Badge
                                variant={
                                  activity.priority === 'high'
                                    ? 'destructive'
                                    : activity.priority === 'medium'
                                      ? 'default'
                                      : 'secondary'
                                }
                              >
                                {activity.priority}
                              </Badge>
                            )}
                            {activity.status && <Badge variant="outline">{activity.status}</Badge>}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          {activity.user && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              by {activity.user}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {derivedResources.map(resource => (
              <Card key={resource.resource}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{resource.resource}</span>
                    <Badge
                      className={
                        resource.status === 'optimal'
                          ? 'bg-green-100 text-green-800'
                          : resource.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }
                    >
                      {resource.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{resource.percentage}%</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {resource.used.toLocaleString()} / {resource.total.toLocaleString()} used
                      </p>
                    </div>
                    <Progress value={resource.percentage} className="h-3" />
                    {resource.trend && (
                      <div className="flex items-center justify-center space-x-2">
                        {resource.trend === 'up' && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        {resource.trend === 'down' && (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        {resource.trend === 'stable' && (
                          <Activity className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {resource.trend}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map(action => (
              <Card key={action.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={cn(
                        'p-3 rounded-lg',
                        action.variant === 'destructive'
                          ? 'bg-red-100 dark:bg-red-900'
                          : action.variant === 'outline'
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : 'bg-blue-100 dark:bg-blue-900'
                      )}
                    >
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{action.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                      <Button
                        variant={action.variant || 'default'}
                        size="sm"
                        className="mt-3"
                        onClick={action.action}
                      >
                        Execute
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedManagementDashboard;
