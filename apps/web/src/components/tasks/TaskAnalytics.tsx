/**
 * TASK ANALYTICS COMPONENT
 * =========================
 * Comprehensive analytics dashboard for task management
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTasks } from '../../api/hooks/useTasks';
import { useFarms } from '../../api/hooks/useFarms';
import type { Task, TaskStatus, TaskPriority } from '../../api/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  ListTodo,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Award,
  Zap,
} from 'lucide-react';

interface TaskAnalyticsProps {
  farmId?: string;
  className?: string;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: '#9ca3af',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#9ca3af',
  normal: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-gray-600' },
  in_progress: { label: 'In Progress', color: 'text-blue-600' },
  completed: { label: 'Completed', color: 'text-green-600' },
  cancelled: { label: 'Cancelled', color: 'text-red-600' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-gray-600' },
  normal: { label: 'Normal', color: 'text-blue-600' },
  high: { label: 'High', color: 'text-amber-600' },
  urgent: { label: 'Urgent', color: 'text-red-600' },
};

export function TaskAnalytics({ farmId, className = '' }: TaskAnalyticsProps) {
  // Get farm and task data
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;
  const { data: tasks, isLoading, error } = useTasks({ farm_id: currentFarmId });

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
        overdue: 0,
        completionRate: 0,
        avgCompletionTime: 0,
        statusDistribution: [],
        priorityDistribution: [],
        categoryDistribution: [],
        weeklyTrend: [],
        monthlyTrend: [],
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Basic counts
    const total = tasks.length;
    const completed = tasks.filter((t: Task) => t.status === 'completed').length;
    const pending = tasks.filter((t: Task) => t.status === 'pending').length;
    const inProgress = tasks.filter((t: Task) => t.status === 'in_progress').length;
    const overdue = tasks.filter((t: Task) => {
      const dueDate = t.due_date ? new Date(t.due_date) : null;
      return dueDate && dueDate < today && t.status !== 'completed';
    }).length;

    // Completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Status distribution for pie chart
    const statusDistribution = Object.entries(
      tasks.reduce((acc: Record<string, number>, task: Task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({
      name: STATUS_CONFIG[status as TaskStatus]?.label || status,
      value: count,
      color: STATUS_COLORS[status as TaskStatus],
    }));

    // Priority distribution for pie chart
    const priorityDistribution = Object.entries(
      tasks.reduce((acc: Record<string, number>, task: Task) => {
        const priority = task.priority || 'normal';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {})
    ).map(([priority, count]) => ({
      name: PRIORITY_CONFIG[priority as TaskPriority]?.label || priority,
      value: count,
      color: PRIORITY_COLORS[priority as TaskPriority],
    }));

    // Category distribution
    const categoryDistribution = Object.entries(
      tasks.reduce((acc: Record<string, number>, task: Task) => {
        const category = (task as any).category || 'uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([category, count]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count as number,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Weekly trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTasks = tasks.filter((t: Task) => {
        const created = t.created_at ? new Date(t.created_at) : null;
        return created && created >= date && created < nextDate;
      });

      const dayCompleted = tasks.filter((t: Task) => {
        const updated = t.updated_at ? new Date(t.updated_at) : null;
        return updated && updated >= date && updated < nextDate && t.status === 'completed';
      });

      weeklyTrend.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        created: dayTasks.length,
        completed: dayCompleted.length,
      });
    }

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthTasks = tasks.filter((t: Task) => {
        const created = t.created_at ? new Date(t.created_at) : null;
        return created && created.getMonth() === month && created.getFullYear() === year;
      });

      const monthCompleted = tasks.filter((t: Task) => {
        const updated = t.updated_at ? new Date(t.updated_at) : null;
        return (
          updated &&
          updated.getMonth() === month &&
          updated.getFullYear() === year &&
          t.status === 'completed'
        );
      });

      monthlyTrend.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        total: monthTasks.length,
        completed: monthCompleted.length,
        rate:
          monthTasks.length > 0 ? Math.round((monthCompleted.length / monthTasks.length) * 100) : 0,
      });
    }

    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate,
      statusDistribution,
      priorityDistribution,
      categoryDistribution,
      weeklyTrend,
      monthlyTrend,
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
        <p className="text-gray-600">Failed to load task analytics data.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            Task Analytics
          </h2>
          <p className="text-gray-600">Track your task performance and productivity</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <ListTodo className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{analytics.completionRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.inProgress}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{analytics.overdue}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {analytics.statusDistribution.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-gray-600">
                    {String(entry.name)}: {String(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.priorityDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {analytics.priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="created"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Created"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="2"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                    name="Completion Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5" />
              Tasks by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    {analytics.categoryDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                {analytics.completionRate >= 70 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-sm font-medium text-gray-600">Completion Trend</span>
              </div>
              <p className="text-lg font-bold">
                {analytics.completionRate >= 70 ? 'On Track' : 'Needs Improvement'}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Pending Tasks</span>
              </div>
              <p className="text-lg font-bold">{analytics.pending} tasks awaiting action</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-600">Attention Required</span>
              </div>
              <p className="text-lg font-bold">
                {analytics.overdue > 0 ? `${analytics.overdue} overdue tasks` : 'No overdue tasks'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TaskAnalytics;
