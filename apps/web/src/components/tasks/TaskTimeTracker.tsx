import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Clock, Play, Pause } from 'lucide-react';
import type { ExtendedTask } from './types';

export interface TaskTimeTrackerProps {
  task?: ExtendedTask;
  tasks?: ExtendedTask[];
  isTimerActive?: boolean;
  timerActive?: { [key: string]: boolean };
  currentTimer?: { taskId: string; startTime: Date } | null;
  onStartTimer: (task: ExtendedTask) => void;
  onStopTimer: (task: ExtendedTask) => void;
  isLoading: boolean;
  [key: string]: any;
}

export function TaskTimeTracker({
  task,
  isTimerActive,
  onStartTimer,
  onStopTimer,
  isLoading,
}: TaskTimeTrackerProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!task)
    return (
      <Card>
        <CardContent>
          <p>No task selected</p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracker - {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold mb-4">{formatTime(task.timeSpent || 0)}</div>
          <Button
            onClick={() => (isTimerActive ? onStopTimer(task) : onStartTimer(task))}
            disabled={isLoading}
            variant={isTimerActive ? 'destructive' : 'default'}
          >
            {isTimerActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Timer
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
