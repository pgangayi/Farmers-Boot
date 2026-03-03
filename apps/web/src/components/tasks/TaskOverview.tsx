/**
 * TASK OVERVIEW COMPONENT
 * ========================
 * Dashboard overview for task management with statistics and quick actions
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../api/hooks/useTasks';
import { useFarms } from '../../api/hooks/useFarms';
import type { Task, TaskStatus, TaskPriority, CreateRequest } from '../../api/types';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ListTodo,
  Plus,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  Edit,
  Trash2,
  Play,
  Pause,
  X,
  Save,
  Loader2,
  RefreshCw,
  ChevronRight,
  User,
  Flag,
} from 'lucide-react';

interface TaskOverviewProps {
  farmId?: string;
  className?: string;
  onTaskSelect?: (task: Task) => void;
}

type FilterStatus = 'all' | TaskStatus;
type FilterPriority = 'all' | TaskPriority;

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { label: 'Medium', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  normal: { label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  urgent: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export function TaskOverview({ farmId, className = '', onTaskSelect }: TaskOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get farm and task data
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;
  const { data: tasks, isLoading, error, refetch } = useTasks({ farm_id: currentFarmId });

  // Mutations
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    let result = [...tasks];

    if (filterStatus !== 'all') {
      result = result.filter(task => task.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      result = result.filter(task => task.priority === filterPriority);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tasks, filterStatus, filterPriority, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!tasks) return { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: tasks.length,
      pending: tasks.filter((t: Task) => t.status === 'pending').length,
      inProgress: tasks.filter((t: Task) => t.status === 'in_progress').length,
      completed: tasks.filter((t: Task) => t.status === 'completed').length,
      overdue: tasks.filter((t: Task) => {
        const dueDate = t.due_date ? new Date(t.due_date) : null;
        return dueDate && dueDate < today && t.status !== 'completed';
      }).length,
    };
  }, [tasks]);

  // Get upcoming tasks
  const upcomingTasks = useMemo(() => {
    if (!tasks) return [];
    const today = new Date();
    return tasks
      .filter((t: Task) => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a: Task, b: Task) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [tasks]);

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      setShowDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { status: newStatus },
      });
      refetch();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tasks</h3>
        <p className="text-gray-600 mb-4">Failed to load task data.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-orange-600" />
            Task Overview
          </h2>
          <p className="text-gray-600">Manage your farm tasks and schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Play className="w-5 h-5 text-blue-600" />
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
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''} require attention
                </p>
                <p className="text-sm text-red-600">
                  Review and update the status of overdue tasks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tasks</CardTitle>
              <div className="flex gap-2">
                <select
                  title="Filter by status"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <option key={status} value={status}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <select
                  title="Filter by priority"
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value as FilterPriority)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="all">All Priority</option>
                  {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                    <option key={priority} value={priority}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Task List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No tasks found</div>
              ) : (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => onTaskSelect?.(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleStatusChange(
                              task,
                              task.status === 'completed' ? 'pending' : 'completed'
                            );
                          }}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            task.status === 'completed'
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {task.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <div>
                          <p
                            className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={
                                PRIORITY_CONFIG[task.priority as TaskPriority]?.bgColor ||
                                'bg-gray-100'
                              }
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              {PRIORITY_CONFIG[task.priority as TaskPriority]?.label ||
                                task.priority}
                            </Badge>
                            {task.due_date && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          title="Edit"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setShowAddModal(true);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          title="Delete"
                          onClick={e => {
                            e.stopPropagation();
                            setShowDeleteConfirm(task.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
                  <p>All caught up!</p>
                </div>
              ) : (
                upcomingTasks.map((task: Task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => onTaskSelect?.(task)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{task.title}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {task.due_date && (
                        <span className="text-xs text-gray-500">
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <Badge
                        className={
                          PRIORITY_CONFIG[task.priority as TaskPriority]?.bgColor || 'bg-gray-100'
                        }
                        variant="outline"
                      >
                        {PRIORITY_CONFIG[task.priority as TaskPriority]?.label}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this task?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteTask(showDeleteConfirm)}
                  disabled={deleteTask.isPending}
                >
                  {deleteTask.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <TaskFormModal
          task={selectedTask}
          farmId={currentFarmId}
          onClose={() => {
            setShowAddModal(false);
            setSelectedTask(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setSelectedTask(null);
            refetch();
          }}
          createTask={createTask}
          updateTask={updateTask}
        />
      )}
    </div>
  );
}

// Task Form Modal
interface TaskFormModalProps {
  task: Task | null;
  farmId?: string;
  onClose: () => void;
  onSave: () => void;
  createTask: { mutateAsync: (data: CreateRequest<Task>) => Promise<Task> };
  updateTask: { mutateAsync: (params: { id: string; data: Partial<Task> }) => Promise<Task> };
}

function TaskFormModal({
  task,
  farmId,
  onClose,
  onSave,
  createTask,
  updateTask,
}: TaskFormModalProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'normal',
    status: task?.status || 'pending',
    due_date: task?.due_date || '',
    category: (task as any)?.category || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (task?.id) {
        await updateTask.mutateAsync({ id: task.id, data: formData });
      } else {
        await createTask.mutateAsync({ ...formData, farm_id: farmId } as CreateRequest<Task>);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{task ? 'Edit Task' : 'Add New Task'}</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" title="Close">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Task description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  title="Select priority"
                  value={formData.priority}
                  onChange={e =>
                    setFormData({ ...formData, priority: e.target.value as TaskPriority })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  title="Select status"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  title="Select due date"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  title="Select category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select category</option>
                  <option value="planting">Planting</option>
                  <option value="harvest">Harvest</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="livestock">Livestock</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {task ? 'Update' : 'Add'} Task
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default TaskOverview;
