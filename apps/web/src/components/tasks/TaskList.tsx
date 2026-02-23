import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Clock, User, Calendar } from 'lucide-react';
import type { ExtendedTask } from './types';

export interface TaskListProps {
  tasks: ExtendedTask[];
  onEditTask: (task: ExtendedTask) => void;
  onStartTimer: (task: ExtendedTask) => void;
  onStopTimer: (task: ExtendedTask) => void;
  timerActive: { [key: string]: boolean };
  isTimerLoading: boolean;
  onViewTask?: (task: ExtendedTask) => void;
  onDeleteTask?: (task: ExtendedTask) => void;
  onStatusChange?: (task: ExtendedTask, status: string) => void;
  onCreate?: () => void;
  [key: string]: any;
}

export function TaskList({
  tasks,
  onEditTask,
  onStartTimer,
  onStopTimer,
  timerActive,
  isTimerLoading,
}: TaskListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <Card key={task.id} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <div className="flex gap-2">
                <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {task.description && <p className="text-sm text-gray-600 mb-3">{task.description}</p>}

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              {task.assignee && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {task.assignee.name}
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
              {task.timeSpent && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.round(task.timeSpent / 60)}h {task.timeSpent % 60}m
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEditTask(task)}>
                Edit
              </Button>

              {task.status !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (timerActive[task.id] ? onStopTimer(task) : onStartTimer(task))}
                  disabled={isTimerLoading}
                >
                  {timerActive[task.id] ? 'Stop Timer' : 'Start Timer'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
